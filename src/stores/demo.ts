import { defineStore } from "pinia";

export const useDemoStore = defineStore("demo", {
  state: () => ({
    modalOpen: false,
  }),

  actions: {
    open() {
      this.modalOpen = true;
    },
    close() {
      this.modalOpen = false;
    },
  },
});
