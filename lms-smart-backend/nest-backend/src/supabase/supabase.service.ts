import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  public client: SupabaseClient;
  public admin: SupabaseClient;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL')!;
    const anonKey = this.config.get<string>('SUPABASE_ANON_KEY')!;
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!;

    this.client = createClient(url, anonKey);

    this.admin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
}