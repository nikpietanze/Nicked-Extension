import type User from "../models/user";
import type State from "./state.d.ts";

export default interface Sync {
	user: User;
	state: State;
}
