import { create } from "zustand";
import { SavedCard } from "../types/savedCard";
import { getSavedCards, deleteSavedCard } from "../services/savedCardService";

interface SavedCardsState {
  cards: SavedCard[];
  loading: boolean;
  addingCard: boolean;
  showAddModal: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  openAddModal: () => void;
  closeAddModal: () => void;
  saveCardLocally: (card: Omit<SavedCard, "id">) => void;
}

export const useSavedCardsStore = create<SavedCardsState>((set, get) => ({
  cards: [],
  loading: false,
  addingCard: false,
  showAddModal: false,
  error: null,

  fetchCards: async () => {
    set({ loading: true, error: null });
    try {
      const cards = await getSavedCards();
      set({ cards, loading: false });
    } catch {
      // Saved cards are not available yet (the endpoint 404s), and a failed list is nothing
      // the user can act on: show the empty state, not a red "Request failed" banner.
      set({ cards: [], loading: false });
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

  openAddModal: () => set({ showAddModal: true, error: null }),
  closeAddModal: () => set({ showAddModal: false }),

  saveCardLocally: (card) => {
    const cards = get().cards;
    const newCard: SavedCard = {
      ...card,
      id: `local-${Date.now()}`,
      isDefault: cards.length === 0,
    };
    set({ cards: [...cards, newCard], showAddModal: false });
  },
}));
