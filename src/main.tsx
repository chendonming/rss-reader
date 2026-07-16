import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles/design.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./i18n";

const theme = createTheme({
  fontFamily: '"Instrument Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", monospace',
  headings: {
    fontFamily: '"Instrument Sans", sans-serif',
  },
  defaultRadius: "sm",
  primaryColor: "dark",
  primaryShade: 8,
  components: {
    ActionIcon: {
      defaultProps: {
        variant: "subtle",
        color: "gray",
      },
    },
    Tooltip: {
      defaultProps: {
        openDelay: 400,
        closeDelay: 100,
        withArrow: true,
        arrowSize: 4,
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <MantineProvider theme={theme} defaultColorScheme="auto">
    <Notifications position="top-right" />
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </MantineProvider>
);
