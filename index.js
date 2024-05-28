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
    console.error('Error sending request:', error.response.data);
  }
}

async function checkAndSendRequests() {
  const collectionRef = db.collection('transactions');
  try {
    const snapshot = await collectionRef.where('status', '==', 'PROCESSING').get();

    if (snapshot.empty) {
      console.log('Não foram encontradas transações em processamento:');
      return;
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(data)
        const payload = {
            type: "TRANSACTION_STATUS_UPDATED",
            tenantId: "92519280-5dc9-4299-a5c6-96957fd9009f",
            timestamp: 1701402436965,
            data: {
            id: data.identification,
            createdAt: 1701402282179,
            lastUpdated: 1701402364170,
            assetId: "WECEDI_ETH_TEST5_LK3A",
            source: {
                id: "24",
                type: "VAULT_ACCOUNT",
                name: "PC - Holding Account",
                subType: ""
            },
            destination: {
                id: "200",
                type: "VAULT_ACCOUNT",
                name: "0.0.4062299",
                subType: ""
            },
            amount: data.amount,
            networkFee: 4.4667677557972e-05,
            netAmount: 1,
            sourceAddress: "0xa5362BB8233C9578e921ac4ab9e6Dc444B246E88",
            destinationAddress: "0x140166230F290ef27d114CAA4f37994C202c54b0",
            destinationAddressDescription: "",
            destinationTag: "",
            status: "COMPLETED",
            txHash: "0x80c3654da0d21f39d094af777bc03423afc8b38da5fb25fcd82664f43e98b825",
            subStatus: "CONFIRMED",
            signedBy: [],
            createdBy: "ae2d6d73-cd6c-4d80-9cac-1a83e188f4d3",
            rejectedBy: "",
            amountUSD: 0,
            addressType: "",
            note: "",
            exchangeTxId: "",
            requestedAmount: 1,
            feeCurrency: "ETH_TEST5",
            operation: "TRANSFER",
            customerRefId: null,
            numOfConfirmations: 1,
            amountInfo: {
                amount: "1.0",
                requestedAmount: "1.0",
                netAmount: "1",
                amountUSD: null
            },
            feeInfo: {
                networkFee: "0.000044667677557972",
                gasPrice: "1.195185764"
            },
            destinations: [],
            externalTxId: null,
            blockInfo: {
                blockHeight: "4799321",
                blockHash: "0x82ca140f1353caf7144dd2d16f1a141c7fd0a3f3ae252dbfec7129a6ed489fe0"
            },
            signedMessages: [],
            index: 0,
            assetType: "ERC20"
            }
        };
        if (data.type == 'CREDIT' | data.type == 'BETWEEN_ACCOUNTS' && data.identification ){
            console.log(`Enviado webhook para transação ${data.identification}`)
            sendHttpRequest(payload);
        }else{
            console.log('webhook não enviado', data)
        }

    });
  } catch (error) {
    console.error('Error checking documents:', error);
  }
}

// Função para iniciar o processo de verificação a cada segundo
function startProcess() {
  setInterval(checkAndSendRequests, 5000);
}

console.log("stating service")
startProcess();