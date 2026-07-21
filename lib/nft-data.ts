export interface NftItem {
  id: string;
  name: string;
  collection: string;
  price: number;
  currency: string;
  color: string;
  creator: string;
}

export const nftItems: NftItem[] = [
  { id: "nft-1", name: "Nebula Fox #204", collection: "Nebula Foxes", price: 2.4, currency: "ETH", color: "#7C3AED", creator: "0x8f...3a2b" },
  { id: "nft-2", name: "Chromatic Ape #88", collection: "Chromatic Apes", price: 1.85, currency: "ETH", color: "#F59E0B", creator: "0x2d...91cc" },
  { id: "nft-3", name: "Voxel Realm #12", collection: "Voxel Realms", price: 640, currency: "SOL", color: "#14F195", creator: "0x9a...44e1" },
  { id: "nft-4", name: "Glass Punk #519", collection: "Glass Punks", price: 3.1, currency: "ETH", color: "#38BDF8", creator: "0x1b...7f09" },
  { id: "nft-5", name: "Aurora Beast #77", collection: "Aurora Beasts", price: 0.92, currency: "ETH", color: "#F472B6", creator: "0x66...bb21" },
  { id: "nft-6", name: "Quantum Cat #331", collection: "Quantum Cats", price: 410, currency: "SOL", color: "#FB923C", creator: "0xa1...20de" },
  { id: "nft-7", name: "Obsidian Golem #6", collection: "Obsidian Golems", price: 5.4, currency: "ETH", color: "#94A3B8", creator: "0x53...9c17" },
  { id: "nft-8", name: "Solstice Bird #142", collection: "Solstice Birds", price: 1.2, currency: "ETH", color: "#34D399", creator: "0xd0...11af" },
];
