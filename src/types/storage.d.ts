import type User from "../models/user";
import type State from "./state.d.ts";

export interface Local {
	user: User;
	state: State;
}

export interface Sync {
	user: {
        id: number,
        email: string,
    }
}
