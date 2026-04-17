import { create } from "zustand";
import { SavedCard } from "../types/savedCard";
import { getSavedCards, deleteSavedCard, addCard } from "../services/savedCardService";

interface SavedCardsState {
  cards: SavedCard[];
  loading: boolean;
  addingCard: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  initiateAddCard: () => Promise<void>;
}

export const useSavedCardsStore = create<SavedCardsState>((set, get) => ({
  cards: [],
  loading: false,
  addingCard: false,
  error: null,

  fetchCards: async () => {
    set({ loading: true, error: null });
    try {
      const cards = await getSavedCards();
      set({ cards, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load cards", loading: false });
    }
  },

  deleteCard: async (id: string) => {
    const prev = get().cards;
    set({ cards: prev.filter((c) => c.id !== id) });
    try {
      await deleteSavedCard(id);
    } catch (err) {
      set({ cards: prev, error: err instanceof Error ? err.message : "Failed to delete card" });
    }
  },

  initiateAddCard: async () => {
    set({ addingCard: true, error: null });
    try {
      const { checkoutUrl } = await addCard();
      window.open(checkoutUrl, "_blank");
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to initiate card addition" });
    } finally {
      set({ addingCard: false });
    }
  },
}));
