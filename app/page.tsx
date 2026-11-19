import WorldMap from "./WorldMap";
import { regions } from "./places";

export default function Home() {
  return <WorldMap regions={regions} />;
}
