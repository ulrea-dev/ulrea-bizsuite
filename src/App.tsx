
import Index from "./pages/Index";

// Temporarily render only Index to isolate invalid hook calls coming from providers/router.
const App = () => (
  <>
    {/* Removed shadcn Toaster and Sonner Toaster during isolation */}
    {/* Removed BrowserRouter/Routes/Route during isolation */}
    <Index />
  </>
);

export default App;
