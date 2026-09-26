import { createContext, useContext } from "react";
import type { Office } from "@/lib/domain";

export const OfficeContext = createContext<Office>({id: -1, name: '', created_at: '', mobile_no: null, address: null});

export const useOffice = () => useContext(OfficeContext);