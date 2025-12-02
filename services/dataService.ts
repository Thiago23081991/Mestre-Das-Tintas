import { supabase } from './supabaseClient';
import { User } from '../types';

export interface GameSessionData {
  player_name: string;
  level: string;
  score: number;
  result: string;
  created_at?: string;
  id?: number;
}

const LOCAL_STORAGE_KEY = 'suvinil_game_sessions';

export const dataService = {
  /**
   * Salva o resultado da partida.
   * Tenta salvar no Supabase; se não configurado, salva no LocalStorage.
   */
  async saveGameSession(user: User, result: 'win' | 'lose') {
    const sessionData: GameSessionData = {
      player_name: user.name,
      level: user.level,
      score: user.score,
      result: result === 'win' ? 'Vitória' : 'Derrota'
    };

    if (supabase) {
      try {
        const { error } = await supabase
          .from('game_sessions')
          .insert([sessionData]);

        if (error) {
          console.error('Erro ao salvar no Supabase:', error);
        }
      } catch (err) {
        console.error('Exception ao salvar dados no Supabase:', err);
      }
    } else {
      // Fallback: LocalStorage
      try {
        const existingData = localStorage.getItem(LOCAL_STORAGE_KEY);
        const history: GameSessionData[] = existingData ? JSON.parse(existingData) : [];
        
        const newEntry: GameSessionData = {
          ...sessionData,
          id: Date.now(),
          created_at: new Date().toISOString()
        };
        
        history.push(newEntry);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
      } catch (e) {
        console.error("Erro ao salvar no LocalStorage:", e);
      }
    }
  },

  /**
   * Busca todo o histórico de partidas para o relatório Admin.
   * Tenta buscar do Supabase; se não configurado, busca do LocalStorage.
   */
  async getAllSessions() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('game_sessions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Erro ao buscar dados do Supabase:', err);
        return [];
      }
    } else {
      // Fallback: LocalStorage
      try {
        const existingData = localStorage.getItem(LOCAL_STORAGE_KEY);
        const history: GameSessionData[] = existingData ? JSON.parse(existingData) : [];
        // Retorna invertido para mostrar os mais recentes primeiro (simulando order desc)
        return history.reverse();
      } catch (e) {
        console.error("Erro ao ler do LocalStorage:", e);
        return [];
      }
    }
  }
};
