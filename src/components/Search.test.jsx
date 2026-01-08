// src/components/Search.test.jsx
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Search from "./Search.jsx";

vi.mock("../lib/api.js", () => ({
  searchModels: vi.fn(),
  getModelCard: vi.fn(),
}));

import { searchModels, getModelCard } from "../lib/api.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const makeCard = (overrides = {}) => ({
  id: overrides.id ?? "m_1",
  canonicalKey: overrides.canonicalKey ?? "toyota_camry_le",
  year: overrides.year ?? 2020,
  make: overrides.make ?? "Toyota",
  model: overrides.model ?? "Camry",
  trim: overrides.trim ?? "LE",
  lastListing:
    overrides.lastListing === undefined
      ? {
          snapshotDate: "2026-01-08",
          price: 23995,
          mileage: 40210,
          region: "Raleigh, NC",
          source: "cars",
        }
      : overrides.lastListing,
  market:
    overrides.market === undefined
      ? {
          weekStart: "2026-01-05",
          medianPrice: 25500,
          p10Price: 21000,
          p90Price: 32000,
          listingCount: 128,
        }
      : overrides.market,
});

describe("Search", () => {
  let user;
  let dateNowSpy;

  beforeEach(() => {
    // Real timers to avoid RTL waitFor polling hanging under fake timers
    user = userEvent.setup();

    searchModels.mockReset();
    getModelCard.mockReset();

    // Make badge math deterministic without fake timers
    dateNowSpy = vi
      .spyOn(Date, "now")
      .mockReturnValue(new Date("2026-01-08T12:00:00.000Z").getTime());
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    dateNowSpy?.mockRestore();
  });

  it("renders initial UI and does not search until 2+ characters", async () => {
    render(<Search />);

    expect(screen.getByPlaceholderText(/Search make/i)).toBeInTheDocument();
    expect(screen.getByText(/Start typing \(2\+ characters\)…/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Search make/i);
    await user.type(input, "c"); // 1 char

    // wait longer than debounce just to be sure nothing fires
    await sleep(300);

    expect(searchModels).not.toHaveBeenCalled();
    expect(getModelCard).not.toHaveBeenCalled();
  });

  it("debounces (250ms) then renders results", async () => {
    const models = [{ id: "a" }, { id: "b" }];
    const cards = [
        makeCard({ id: "a" }),
        makeCard({ id: "b", model: "Corolla", canonicalKey: "toyota_corolla_se" }),
    ];

    searchModels.mockResolvedValueOnce(models);
    getModelCard.mockImplementation(async (id) => cards.find((c) => c.id === id));

    render(<Search />);

    const input = screen.getByPlaceholderText(/Search make/i);
    await user.type(input, "ca");

    // Immediately after typing, debounce hasn't fired yet
    expect(searchModels).not.toHaveBeenCalled();

    // Wait just past debounce window
    await sleep(260);

    // Now the request should have been made
    await waitFor(() => expect(searchModels).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getModelCard).toHaveBeenCalledTimes(2));

    // Results should render
    expect(await screen.findByText("2 results")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /2020 Toyota Camry \(LE\)/i })).toHaveAttribute(
        "href",
        "/model/a"
    );
    expect(screen.getByRole("link", { name: /2020 Toyota Corolla \(LE\)/i })).toHaveAttribute(
        "href",
        "/model/b"
    );
});


  it("renders Today/Yesterday badges from snapshotDate", async () => {
    searchModels.mockResolvedValueOnce([{ id: "t" }, { id: "y" }]);
    getModelCard
      .mockResolvedValueOnce(
        makeCard({
          id: "t",
          model: "Civic",
          lastListing: { ...makeCard().lastListing, snapshotDate: "2026-01-08" },
        })
      )
      .mockResolvedValueOnce(
        makeCard({
          id: "y",
          model: "Accord",
          lastListing: { ...makeCard().lastListing, snapshotDate: "2026-01-07" },
        })
      );

    render(<Search />);
    const input = screen.getByPlaceholderText(/Search make/i);

    await user.type(input, "ho");
    await sleep(260);

    await waitFor(() => expect(screen.getByText("2 results")).toBeInTheDocument());

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("shows 'No listings' and hides market strip when lastListing/market are null", async () => {
    searchModels.mockResolvedValueOnce([{ id: "n" }]);
    getModelCard.mockResolvedValueOnce(
      makeCard({
        id: "n",
        model: "Outback",
        trim: "",
        lastListing: null,
        market: null,
      })
    );

    render(<Search />);
    const input = screen.getByPlaceholderText(/Search make/i);

    await user.type(input, "su");
    await sleep(260);

    await waitFor(() => expect(screen.getByText("1 result")).toBeInTheDocument());

    expect(screen.getByText(/No listings/i)).toBeInTheDocument();
    expect(screen.queryByText(/Market median/i)).not.toBeInTheDocument();
  });

  it("shows 'No results.' when API returns empty array", async () => {
    searchModels.mockResolvedValueOnce([]);

    render(<Search />);
    const input = screen.getByPlaceholderText(/Search make/i);

    await user.type(input, "zz");
    await sleep(260);

    await waitFor(() => expect(searchModels).toHaveBeenCalledTimes(1));

    expect(screen.getByText("0 results")).toBeInTheDocument();
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("shows error UI when search throws", async () => {
    searchModels.mockRejectedValueOnce(new Error("Network down"));

    render(<Search />);
    const input = screen.getByPlaceholderText(/Search make/i);

    await user.type(input, "ca");
    await sleep(260);

    await waitFor(() => expect(screen.getByText(/Something went wrong\./i)).toBeInTheDocument());
    expect(screen.getByText(/Network down/i)).toBeInTheDocument();
  });

  it("clears results when query becomes < 2 chars again", async () => {
    searchModels.mockResolvedValueOnce([{ id: "a" }]);
    getModelCard.mockResolvedValueOnce(makeCard({ id: "a" }));

    render(<Search />);
    const input = screen.getByPlaceholderText(/Search make/i);

    await user.type(input, "ca");
    await sleep(260);

    await waitFor(() => expect(screen.getByText("1 result")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /2020 Toyota Camry \(LE\)/i })).toBeInTheDocument();

    // Backspace to 1 char => effect should reset to idle and clear results
    await user.keyboard("{Backspace}");

    await waitFor(() =>
      expect(screen.getByText(/Start typing \(2\+ characters\)…/i)).toBeInTheDocument()
    );
    expect(screen.queryByRole("link", { name: /2020 Toyota Camry/i })).not.toBeInTheDocument();
  });
});
