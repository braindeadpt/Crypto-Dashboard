import {
  createLocalStore,
  type LocalEnvelope,
} from "@/lib/local/store";

/** Public wallet addresses — live only in the user's browser. */
export type SavedAddress = {
  address: string;
  label: string;
  addedAt: string;
};

export type AddressesData = {
  addresses: SavedAddress[];
  /** Optional user-owned Etherscan API key (BYOK) — never leaves the browser except as a request header to our proxy. */
  etherscanKey: string;
};

export const ADDRESSES_KEY = "clareza-addresses";
export const ADDRESSES_VERSION = 1;
export const ADDRESSES_MAX = 10;

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const BTC_RE =
  /^(bc1[a-z0-9]{11,71}|tb1[a-z0-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/i;

const isAddress = (v: string) => ADDRESS_RE.test(v) || BTC_RE.test(v);

export function isAddressesData(v: unknown): v is AddressesData {
  if (!v || typeof v !== "object") return false;
  const d = v as AddressesData;
  if (!Array.isArray(d.addresses)) return false;
  return d.addresses.every(
    (a) =>
      a &&
      typeof a === "object" &&
      isAddress(a.address) &&
      typeof a.label === "string" &&
      typeof a.addedAt === "string",
  );
}

export const addressesStore = createLocalStore<AddressesData>({
  key: ADDRESSES_KEY,
  version: ADDRESSES_VERSION,
  defaultValue: { addresses: [], etherscanKey: "" },
  validate: isAddressesData,
});

export function listSavedAddresses(
  env?: LocalEnvelope<AddressesData>,
): SavedAddress[] {
  return (env ?? addressesStore.get()).data.addresses;
}

export function getEtherscanKey(env?: LocalEnvelope<AddressesData>): string {
  return (env ?? addressesStore.get()).data.etherscanKey ?? "";
}

export function setEtherscanKey(key: string): void {
  const env = addressesStore.get();
  addressesStore.set({ ...env.data, etherscanKey: key });
}

export function addSavedAddress(
  address: string,
  label = "",
): { ok: true } | { ok: false; reason: "full" | "dup" | "invalid" } {
  const normalized = address.trim();
  if (!isAddress(normalized)) return { ok: false, reason: "invalid" };
  const current = listSavedAddresses();
  if (current.some((a) => a.address.toLowerCase() === normalized.toLowerCase())) {
    return { ok: false, reason: "dup" };
  }
  if (current.length >= ADDRESSES_MAX) return { ok: false, reason: "full" };
  addressesStore.set({
    ...addressesStore.get().data,
    addresses: [
      ...current,
      {
        address: normalized,
        label: label.trim(),
        addedAt: new Date().toISOString(),
      },
    ],
  });
  return { ok: true };
}

export function removeSavedAddress(address: string): SavedAddress[] {
  const next = listSavedAddresses().filter(
    (a) => a.address.toLowerCase() !== address.toLowerCase(),
  );
  addressesStore.set({ ...addressesStore.get().data, addresses: next });
  return next;
}
