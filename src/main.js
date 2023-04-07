import 'core-js/actual';
import { listen } from "@ledgerhq/logs";
import BtcNew from "@ledgerhq/hw-app-btc";

import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";

// globally available ledger bitcoin app and transport
// TODO: not nice, better to incapsulate in the Ledger device class, but ok for PoC
let transport = null;
let ledgerapp = null;

const errmsg = document.getElementById("errormsg");

// Create bitcoin app using TransportClass provided as an argument.
// All transports are the same, so we can reuse the code for app creation.
async function create_app(TransportClass) {
  try {
    transport = await TransportClass.create();

    // listen to the events which are sent by the Ledger packages for debugging
    listen(log => console.log(log))

    // create Btc app using new API (with PSBT and stuff)
    ledgerapp = new BtcNew({ transport, currency: "bitcoin" });
    console.log("connected");

    // hide connection element, show action elements
    document.getElementById("connect-container").style.display = 'none';
    document.getElementById("actions").style.display = 'flex';
    // clear error if we got here
    errmsg.innerText = "";
  } catch (e) {
    console.error(e);
    errmsg.innerText = e;
  };
}

document.getElementById("connect-webusb").addEventListener("click", async () => {
  // create an app via webusb transport
  await create_app(TransportWebUSB);
});
document.getElementById("connect-webhid").addEventListener("click", async () => {
  // create an app via webusb transport
  await create_app(TransportWebHID);
});
document.getElementById("connect-webble").addEventListener("click", async () => {
  // create an app via webusb transport
  await create_app(TransportWebBLE);
});

// getting master fingerprint is not exposed in the npm module,
// so we do it manually by sending APDU command as described in
// https://github.com/LedgerHQ/app-bitcoin-new/blob/master/doc/bitcoin.md#get_master_fingerprint
async function getFingerprint(){
  const fgp = await transport.send(0xE1, 0x05);
  return Array.from(fgp)
  .map(byte => byte.toString(16).padStart(2, '0'))
  .join('').substr(0, 8);
}

document.getElementById("get-xpub").addEventListener("click", async () => {
  try {
    const derivation = "M/48'/0'/0'/2'";
    // get xpub first, version is 0x0488B21E for mainnet and 0x043587CF for testnet
    const xpub = await ledgerapp.getWalletXpub(
      { path: derivation, xpubVersion: 0x0488B21E }
    );
    // get master fingerprint so we can construct the string like [fgp/derivation]xpub
    const fgp = await getFingerprint();
    // construct final descriptor key with all necessary info
    const result = `[${fgp}${derivation.substr(1)}]${xpub}`;

    //Display your bitcoin address on the screen
    document.getElementById("xpub").innerText = result;
    // clear error if we got here
    errmsg.innerText = "";
  } catch (e) {
    console.error(e);
    errmsg.innerText = e;
  }
});
