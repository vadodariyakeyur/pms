import { createContext, useContext } from "react";
import { Database } from "@/lib/supabase/types";

type OfficeContextType = Database["public"]["Tables"]["offices"]["Row"];

export const OfficeContext = createContext<OfficeContextType>({id: -1, name: '', created_at: ''});

export const useOffice = () => useContext(OfficeContext);