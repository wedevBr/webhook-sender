const admin = require('firebase-admin');
const axios = require('axios');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const targetUrl = 'https://api-uoleti-prod-v77genjdha-uc.a.run.app/transaction/webhook/65707a98e581a683cabf4a4f';

async function sendHttpRequest(payload) {
  try {
    const response = await axios.post(targetUrl, payload);
    console.log('Request sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending request:', error?.response?.data || error.message);
  }
}

// Função sleep para criar um intervalo entre as requisições
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkAndSendRequests() {
  const collectionRef = db.collection('transactions');
  try {
    const snapshot = await collectionRef
      .where('status', '==', 'PROCESSING')
      .where('credential_id', '==', '65707a98e581a683cabf4a4f')
      .get();

    if (snapshot.empty) {
      console.log('Não foram encontradas transações em processamento.');
      return;
    }

    for (const doc of snapshot.docs) {  // 🔹 Usando `for...of` para permitir `await`
      const data = doc.data();
      console.log(data);

      const payload = {
        type: "TRANSACTION_STATUS_UPDATED",
        tenantId: "92519280-5dc9-4299-a5c6-96957fd9009f",
        timestamp: Date.now(),
        data: {
          id: data.identification,
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          amount: data.amount,
          status: "COMPLETED",
          subStatus: "CONFIRMED",
          operation: "TRANSFER",
          assetType: "ERC20"
        }
      };

      if ((data.type === 'CREDIT' || data.type === 'BETWEEN_ACCOUNTS') && data.identification) {
        console.log(`✅ Enviando webhook para transação ${data.identification}`);
        await sendHttpRequest(payload);
        await sleep(2000);  // 🔹 Aguarda 2 segundos antes da próxima requisição
      } else {
        console.log('🚫 Webhook não enviado', data);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar documentos:', error);
  }
}

// Função para iniciar o processo de verificação a cada 5 segundos
function startProcess() {
  setInterval(checkAndSendRequests, 5000);
}

console.log("🔄 Iniciando serviço...");
startProcess();
