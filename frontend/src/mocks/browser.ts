import { setupWorker } from "msw/browser";
import { fakeOnlyHandlers } from "./handlers";

export const worker = setupWorker(...fakeOnlyHandlers);
