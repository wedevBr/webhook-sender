const admin = require('firebase-admin');
const axios = require('axios');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const targetUrl = 'https://api-uoleti-prod-v77genjdha-uc.a.run.app/transaction/webhook/65707a98e581a683cabf4a4f';

// 🔹 Função para fazer um delay entre requisições
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 🔹 Função para buscar transações e enviar webhooks
async function checkAndSendRequests() {
  try {
    const snapshot = await db.collection('transactions')
      .where('status', '==', 'PROCESSING')
      .where('credential_id', '==', '65707a98e581a683cabf4a4f')
      .orderBy('created_at', 'asc')  // 🔹 Ordenação crescente (mais antigo primeiro)
      .get();

    if (snapshot.empty) {
      console.log('🟡 Nenhuma transação em processamento encontrada.');
      return;
    }

    for (const doc of snapshot.docs) {  
      const data = doc.data();
      console.log('📄 Transação encontrada:', data);

      if (!data.identification || !['CREDIT', 'BETWEEN_ACCOUNTS', 'BETWEEN'].includes(data.type)) {
        console.log('🚫 Webhook NÃO enviado: Condições não atendidas.');
        continue;
      }

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

      console.log(`✅ Enviando webhook para transação ${data.identification}...`);
      try {
        const response = await axios.post(targetUrl, payload);
        console.log(`📤 Webhook enviado com sucesso:`, response.data);
      } catch (error) {
        console.error('❌ Erro ao enviar webhook:', error?.response?.data || error.message);
      }

      await sleep(2000);  // 🔹 Aguarda 2 segundos antes de enviar a próxima requisição
    }
  } catch (error) {
    console.error('❌ Erro ao consultar transações:', error);
  }
}

// 🔄 Loop contínuo em vez de `setInterval`
async function startProcess() {
  console.log("🔄 Iniciando serviço de verificação de transações...");
  while (true) {
    await checkAndSendRequests();
    await sleep(5000); // 🔹 Aguarda 5s antes de repetir a busca
  }
}

startProcess();
