export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      blockchains_glacier: {
        Row: {
          blockchain_id: string
          blockchain_name: string
          chain_logo_url: string | null
          create_block_number: number
          create_block_timestamp: number
          description: string | null
          details: Json | null
          evm_chain_id: number | null
          explorer_url: string | null
          id: number
          network: Database["public"]["Enums"]["network"]
          rpc_url: string | null
          subnet_id: string
          token_decimals: number | null
          token_description: string | null
          token_logo_url: string | null
          token_name: string | null
          token_symbol: string | null
          vm_id: string
          vm_name: string | null
          ws_url: string | null
        }
        Insert: {
          blockchain_id: string
          blockchain_name: string
          chain_logo_url?: string | null
          create_block_number?: number
          create_block_timestamp?: number
          description?: string | null
          details?: Json | null
          evm_chain_id?: number | null
          explorer_url?: string | null
          id?: never
          network: Database["public"]["Enums"]["network"]
          rpc_url?: string | null
          subnet_id: string
          token_decimals?: number | null
          token_description?: string | null
          token_logo_url?: string | null
          token_name?: string | null
          token_symbol?: string | null
          vm_id: string
          vm_name?: string | null
          ws_url?: string | null
        }
        Update: {
          blockchain_id?: string
          blockchain_name?: string
          chain_logo_url?: string | null
          create_block_number?: number
          create_block_timestamp?: number
          description?: string | null
          details?: Json | null
          evm_chain_id?: number | null
          explorer_url?: string | null
          id?: never
          network?: Database["public"]["Enums"]["network"]
          rpc_url?: string | null
          subnet_id?: string
          token_decimals?: number | null
          token_description?: string | null
          token_logo_url?: string | null
          token_name?: string | null
          token_symbol?: string | null
          vm_id?: string
          vm_name?: string | null
          ws_url?: string | null
        }
        Relationships: []
      }
      blockchains_lancer: {
        Row: {
          blockchain_id: string | null
          blockchain_name: string
          chain_logo_url: string | null
          deployer_allow_list: boolean | null
          description: string | null
          details: Json | null
          evm_chain_id: number
          explorer_url: string | null
          genesis: Json | null
          id: number
          native_minter: boolean | null
          network: Database["public"]["Enums"]["network"]
          owner_addr: string
          rpc_url: string | null
          subnet_id: string | null
          token_decimals: number
          token_description: string
          token_logo_url: string | null
          token_name: string
          token_symbol: string
          tx_allow_list: boolean | null
          vm_id: string
          vm_name: string
          ws_url: string | null
        }
        Insert: {
          blockchain_id?: string | null
          blockchain_name?: string
          chain_logo_url?: string | null
          deployer_allow_list?: boolean | null
          description?: string | null
          details?: Json | null
          evm_chain_id?: number
          explorer_url?: string | null
          genesis?: Json | null
          id?: never
          native_minter?: boolean | null
          network: Database["public"]["Enums"]["network"]
          owner_addr: string
          rpc_url?: string | null
          subnet_id?: string | null
          token_decimals?: number
          token_description?: string
          token_logo_url?: string | null
          token_name?: string
          token_symbol?: string
          tx_allow_list?: boolean | null
          vm_id?: string
          vm_name?: string
          ws_url?: string | null
        }
        Update: {
          blockchain_id?: string | null
          blockchain_name?: string
          chain_logo_url?: string | null
          deployer_allow_list?: boolean | null
          description?: string | null
          details?: Json | null
          evm_chain_id?: number
          explorer_url?: string | null
          genesis?: Json | null
          id?: never
          native_minter?: boolean | null
          network?: Database["public"]["Enums"]["network"]
          owner_addr?: string
          rpc_url?: string | null
          subnet_id?: string | null
          token_decimals?: number
          token_description?: string
          token_logo_url?: string | null
          token_name?: string
          token_symbol?: string
          tx_allow_list?: boolean | null
          vm_id?: string
          vm_name?: string
          ws_url?: string | null
        }
        Relationships: []
      }
      subnet_profiles: {
        Row: {
          description: string | null
          id: number
          photo_url: string | null
        }
        Insert: {
          description?: string | null
          id: number
          photo_url?: string | null
        }
        Update: {
          description?: string | null
          id?: number
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subnet_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "subnets"
            referencedColumns: ["id"]
          },
        ]
      }
      subnets: {
        Row: {
          blockchain_id: string
          chain_desc: string | null
          created_at: string
          deleted_at: string | null
          deployer_allow_list: boolean | null
          id: number
          initial_user: string | null
          name: string | null
          native_minter: boolean | null
          subnet_id: string
          token_symbol: string
          tx_allow_list: boolean | null
          updated_at: string
          user_id: string | null
          vm_id: string
        }
        Insert: {
          blockchain_id: string
          chain_desc?: string | null
          created_at?: string
          deleted_at?: string | null
          deployer_allow_list?: boolean | null
          id?: number
          initial_user?: string | null
          name?: string | null
          native_minter?: boolean | null
          subnet_id: string
          token_symbol: string
          tx_allow_list?: boolean | null
          updated_at?: string
          user_id?: string | null
          vm_id: string
        }
        Update: {
          blockchain_id?: string
          chain_desc?: string | null
          created_at?: string
          deleted_at?: string | null
          deployer_allow_list?: boolean | null
          id?: number
          initial_user?: string | null
          name?: string | null
          native_minter?: boolean | null
          subnet_id?: string
          token_symbol?: string
          tx_allow_list?: boolean | null
          updated_at?: string
          user_id?: string | null
          vm_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subnets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          is_hot: boolean
          subnet_id: number
          updated_at: string
          user_id: number
        }
        Insert: {
          is_hot: boolean
          subnet_id: number
          updated_at?: string
          user_id: number
        }
        Update: {
          is_hot?: boolean
          subnet_id?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_subnet_id_fkey"
            columns: ["subnet_id"]
            isOneToOne: false
            referencedRelation: "subnets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      blockchains_view: {
        Row: {
          blockchain_id: string | null
          blockchain_name: string | null
          blockchains_lancer_id: number | null
          chain_logo_url: string | null
          deployer_allow_list: boolean | null
          description: string | null
          details: Json | null
          evm_chain_id: number | null
          explorer_url: string | null
          genesis: Json | null
          is_lancer: boolean | null
          native_minter: boolean | null
          network: Database["public"]["Enums"]["network"] | null
          owner_addr: string | null
          rpc_url: string | null
          subnet_id: string | null
          token_decimals: number | null
          token_description: string | null
          token_logo_url: string | null
          token_name: string | null
          token_symbol: string | null
          tx_allow_list: boolean | null
          vm_id: string | null
          vm_name: string | null
          ws_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      network: "mainnet" | "fuji" | "local" | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never
