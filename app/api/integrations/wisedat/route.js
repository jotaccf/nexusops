import { createPublicKey, publicEncrypt, constants } from "crypto";
import { NextResponse } from "next/server";

/**
 * Constrói uma RSA public key a partir de modulus e exponent em base64.
 * Usa o formato SubjectPublicKeyInfo (SPKI) compatível com Node.js crypto.
 */
function buildRsaPublicKey(modulusB64, exponentB64) {
  const modulus  = Buffer.from(modulusB64,  "base64");
  const exponent = Buffer.from(exponentB64, "base64");

  function encodeLength(len) {
    if (len < 128) return Buffer.from([len]);
    const bytes = [];
    let l = len;
    while (l > 0) { bytes.unshift(l & 0xff); l >>= 8; }
    return Buffer.from([0x80 | bytes.length, ...bytes]);
  }

  function encodeInteger(buf) {
    const data = (buf[0] & 0x80)
      ? Buffer.concat([Buffer.from([0x00]), buf])
      : buf;
    return Buffer.concat([Buffer.from([0x02]), encodeLength(data.length), data]);
  }

  const modInt  = encodeInteger(modulus);
  const expInt  = encodeInteger(exponent);
  const seqBody = Buffer.concat([modInt, expInt]);
  const rsaKey  = Buffer.concat([Buffer.from([0x30]), encodeLength(seqBody.length), seqBody]);

  // AlgorithmIdentifier: OID rsaEncryption + NULL
  const algId     = Buffer.from("300d06092a864886f70d0101010500", "hex");
  const bsBody    = Buffer.concat([Buffer.from([0x00]), rsaKey]);
  const bitString = Buffer.concat([Buffer.from([0x03]), encodeLength(bsBody.length), bsBody]);
  const spkiBody  = Buffer.concat([algId, bitString]);
  const spki      = Buffer.concat([Buffer.from([0x30]), encodeLength(spkiBody.length), spkiBody]);

  const pem = [
    "-----BEGIN PUBLIC KEY-----",
    ...spki.toString("base64").match(/.{1,64}/g),
    "-----END PUBLIC KEY-----",
  ].join("\n");

  return createPublicKey({ key: pem, format: "pem", type: "spki" });
}

/**
 * POST /api/integrations/wisedat
 * Body: { url, apiKey, username, password }
 * 1. GET {url}/status         → { PublicKey: [modulus_b64, exponent_b64] }
 * 2. Encrypt "{apiKey};{username};{password}" com RSA PKCS1_v1_5
 * 3. POST {url}/authentication/login  Authorization: WDAPI {base64_encrypted}
 * 4. Devolve { auth_token, success: true }
 */
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { url, apiKey, username, password } = body || {};

  if (!url || !apiKey || !username || !password) {
    return NextResponse.json(
      { error: "Preenche todos os campos: url, apiKey, username, password" },
      { status: 400 }
    );
  }

  const base = url.replace(/\/$/, "");

  // Passo 1: obter chave pública
  let statusData;
  try {
    const r = await fetch(`${base}/status`, { method: "GET" });
    if (!r.ok) throw new Error(`Status HTTP ${r.status}`);
    statusData = await r.json();
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao contactar Wisedat /status: ${err.message}` },
      { status: 502 }
    );
  }

  const pubKeyArr = statusData?.PublicKey;
  if (!Array.isArray(pubKeyArr) || pubKeyArr.length < 2) {
    return NextResponse.json(
      { error: "Resposta inesperada do Wisedat /status — PublicKey não encontrado" },
      { status: 502 }
    );
  }

  const [modulusB64, exponentB64] = pubKeyArr;

  // Passo 2: cifrar credenciais
  let encryptedB64;
  try {
    const publicKey = buildRsaPublicKey(modulusB64, exponentB64);
    const plain     = Buffer.from(`${apiKey};${username};${password}`, "utf8");
    const encrypted = publicEncrypt(
      { key: publicKey, padding: constants.RSA_PKCS1_PADDING },
      plain
    );
    encryptedB64 = encrypted.toString("base64");
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao cifrar credenciais: ${err.message}` },
      { status: 500 }
    );
  }

  // Passo 3: autenticar
  let authData;
  try {
    const r = await fetch(`${base}/authentication/login`, {
      method: "POST",
      headers: { Authorization: `WDAPI ${encryptedB64}` },
    });
    if (!r.ok) throw new Error(`Status HTTP ${r.status}`);
    authData = await r.json();
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao autenticar no Wisedat: ${err.message}` },
      { status: 502 }
    );
  }

  const auth_token = authData?.auth_token;
  if (!auth_token) {
    return NextResponse.json(
      { error: "Autenticação falhou — auth_token não recebido", raw: authData },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true, auth_token });
}
