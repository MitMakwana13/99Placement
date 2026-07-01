export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string
          created_at: string
          name: string
          initials: string
          role: string
          experience: number
          location: string
          skills: string[]
          source: string
          stage: string
          notice_days: number
          expected_ctc: number
          email: string
          phone: string
          summary: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          initials?: string
          role: string
          experience: number
          location: string
          skills: string[]
          source: string
          stage?: string
          notice_days?: number
          expected_ctc?: number
          email: string
          phone: string
          summary?: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          initials?: string
          role?: string
          experience?: number
          location?: string
          skills?: string[]
          source?: string
          stage?: string
          notice_days?: number
          expected_ctc?: number
          email?: string
          phone?: string
          summary?: string
        }
        Relationships: []
      }
      requirements: {
        Row: {
          id: string
          created_at: string
          client: string
          role: string
          location: string
          urgency: string
          deadline_days: number
          band: string
          jd: string
        }
        Insert: {
          id?: string
          created_at?: string
          client: string
          role: string
          location: string
          urgency: string
          deadline_days: number
          band: string
          jd: string
        }
        Update: {
          id?: string
          created_at?: string
          client?: string
          role?: string
          location?: string
          urgency?: string
          deadline_days?: number
          band?: string
          jd?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          id: string
          created_at: string
          candidate_id: string
          scores: {
            aptitude: number
            gk: number
            current_affairs: number
            reasoning: number
            english: number
            computer: number
          }
        }
        Insert: {
          id?: string
          created_at?: string
          candidate_id: string
          scores: {
            aptitude: number
            gk: number
            current_affairs: number
            reasoning: number
            english: number
            computer: number
          }
        }
        Update: {
          id?: string
          created_at?: string
          candidate_id?: string
          scores?: {
            aptitude?: number
            gk?: number
            current_affairs?: number
            reasoning?: number
            english?: number
            computer?: number
          }
        }
        Relationships: [
          {
            foreignKeyName: "assessments_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
