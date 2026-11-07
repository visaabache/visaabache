export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  redirectTo?: string;
  data?: Record<string, unknown>;
};

export const initialState: ActionState = {};
