import "./App.css";
import AppDrawer from "./components/drawer";
import AppRouter from "./router";

function App() {
  return (
    <AppDrawer>
      <AppRouter />
    </AppDrawer>
  );
}

export default App;