import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getErrorMessage } from '../../api/errors';
import * as api from '../../api/services';
import { TOKEN_STORAGE_KEY } from '../../api/services';
import type { AuthUser } from '../../types/backoffice';
import { isTokenExpired, userFromToken } from '../../utils/jwt';

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const restoreSession = (): Pick<AuthState, 'token' | 'user'> => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return { token: null, user: null };
  }
  const user = userFromToken(token);
  if (!user) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return { token: null, user: null };
  }
  return { token, user };
};

const initialState: AuthState = { ...restoreSession(), status: 'idle', error: null };

export const loginUser = createAsyncThunk<
  { token: string; user: AuthUser },
  { username: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ username, password }, { rejectWithValue }) => {
  try {
    const { access_token: token } = await api.login(username, password);
    const user = userFromToken(token);
    if (!user) return rejectWithValue('Le jeton reçu ne contient pas de rôle valide.');
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return { token, user };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Identifiant ou mot de passe incorrect.'));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      state.token = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Connexion impossible.';
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
