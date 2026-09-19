import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
const storage={getItem:(key:string)=>SecureStore.getItemAsync(key),setItem:(key:string,value:string)=>SecureStore.setItemAsync(key,value),removeItem:(key:string)=>SecureStore.deleteItemAsync(key)};
export const configured=Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL&&process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY&&process.env.EXPO_PUBLIC_APP_URL?.startsWith("https://"));
export const appUrl=process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/,"")||"";
export const supabase=createClient(process.env.EXPO_PUBLIC_SUPABASE_URL||"https://example.supabase.co",process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"unconfigured",{auth:{storage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
