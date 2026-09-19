import { Alert, Platform } from "react-native";
import { supabase } from "./supabase";
import { routeUrls } from "./address";
export async function showDirections(destination: string, userId: string, open: (url: string) => Promise<void>) {
  function chooseApp(origin = "") {
    const urls = routeUrls(destination, origin);
    Alert.alert("Abrir trajeto", origin ? `Saída: ${origin}\nDestino: ${destination}\nO Waze usa sua posição atual.` : `Saída: posição atual\nDestino: ${destination}`, [
      { text: "Google Maps", onPress: () => void open(urls.google) },
      { text: "Waze", onPress: () => void open(urls.waze) },
      ...(Platform.OS === "ios" ? [{ text: "Mapas da Apple", onPress: () => void open(urls.apple) }] : []),
    ], { cancelable: true });
  }
  try {
    const profile = await supabase.from("profiles").select("address_street,address_number,address_city,address_state").eq("id", userId).single();
    const home = profile.data;
    if (profile.error || !home?.address_street || !home?.address_city) {
      Alert.alert("Endereço residencial indisponível", "Você pode iniciar o trajeto da posição atual ou completar seu endereço no perfil.", [
        { text: "Voltar", style: "cancel" }, { text: "Usar posição atual", onPress: () => chooseApp() },
      ]); return;
    }
    const origin = [home.address_street, home.address_number, home.address_city, home.address_state].filter(Boolean).join(", ");
    Alert.alert("De onde você vai sair?", origin, [
      { text: "Voltar", style: "cancel" }, { text: "Posição atual", onPress: () => chooseApp() },
      { text: "Endereço cadastrado", onPress: () => chooseApp(origin) },
    ]);
  } catch { Alert.alert("Não foi possível consultar seu endereço", "Atualize o perfil e tente novamente."); }
}
