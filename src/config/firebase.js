import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./service-account-key.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fitflick-55cca-default-rtdb.firebaseio.com",
});

const firebaseDb = admin.database();
export default firebaseDb;
