import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logger } from "@/utils/logger";
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

export interface LocationDrawerRef {
  openDrawer: () => void;
}

const LocationDrawer = forwardRef<
  LocationDrawerRef,
  {
    userLocation: { lat: number; lng: number } | null;
    selectedOrigin: { lat: number; lng: number; address?: string } | null;
    selectedDestination: { lat: number; lng: number; address?: string } | null;
    setSelectedOrigin: (
      origin: { lat: number; lng: number; address?: string } | null
    ) => void;
    setSelectedDestination: (
      destination: { lat: number; lng: number; address?: string } | null
    ) => void;
    onStartDriving: () => void;
    isDriving: boolean;
    routes: google.maps.DirectionsRoute[] | null;
    selectedRouteIndex?: number;
    setSelectedRouteIndex?: (index: number) => void;
  }
>(
  (
    {
      userLocation,
      selectedOrigin,
      selectedDestination,
      setSelectedOrigin,
      setSelectedDestination,
      onStartDriving,
      isDriving,
      routes,
      selectedRouteIndex = 0,
      setSelectedRouteIndex = () => {},
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      openDrawer: () => setOpen(true),
    }));

    return (
      <div className="fixed bottom-6 left-6 right-6 z-10 pointer-events-none">
        <Drawer open={open} onOpenChange={setOpen} repositionInputs={false}>
          <DrawerContent className="h-[500px] pointer-events-auto">
            <div className="p-4">
              <PlacesAutocomplete
                label="From"
                currentPosition={userLocation}
                selectedPlace={selectedOrigin}
                setSelectedPlace={setSelectedOrigin}
              />
              <PlacesAutocomplete
                label="To"
                selectedPlace={selectedDestination}
                setSelectedPlace={setSelectedDestination}
              />

              {routes && routes.length > 0 && (
                <ScrollArea className="mt-3 h-50 block rounded-md border border-border bg-background">
                  <div className="p-2 space-y-2">
                    {routes.map((route, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          i === selectedRouteIndex
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        onClick={() => setSelectedRouteIndex(i)}>
                        <p className="text-sm font-medium">
                          {route.summary || `Route ${i + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {route.legs[0].distance?.text} •{" "}
                          {route.legs[0].duration?.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Start Driving Button */}
              {!isDriving && (
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      onStartDriving();
                      setOpen(false);
                    }}
                    disabled={!selectedOrigin || !selectedDestination}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    Start Driving
                  </Button>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }
);

LocationDrawer.displayName = "LocationDrawer";

// Component for place autocomplete input
interface PlacesAutocompleteProps {
  label: string;
  selectedPlace?: { lat: number; lng: number; address?: string } | null;
  setSelectedPlace: (
    destination: { lat: number; lng: number; address?: string } | null
  ) => void;
  currentPosition?: { lat: number; lng: number } | null;
}

const PlacesAutocomplete = ({
  label,
  selectedPlace,
  setSelectedPlace,
  currentPosition,
}: PlacesAutocompleteProps) => {
  const [inputValue, setInputValue] = useState(selectedPlace?.address);

  useEffect(() => {
    if (selectedPlace) {
      logger.log("Selected place changed:", selectedPlace);
      setInputValue(selectedPlace.address);
    }
  }, [selectedPlace]);

  const {
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  const handleSelect = async (place_id: string, address: string) => {
    setInputValue(address);
    clearSuggestions();

    const result = await getGeocode({ placeId: place_id });
    const { lat, lng } = await getLatLng(result[0]);

    logger.log("Geocoded location:", { lat, lng, address });
    setSelectedPlace({ lat, lng, address });
  };

  const handleSelectCurrentLocation = () => {
    if (!currentPosition) return;
    setValue("");
    setInputValue("Current Location");
    setSelectedPlace({
      lat: currentPosition.lat,
      lng: currentPosition.lng,
      address: "Current Location",
    });
    clearSuggestions();
  };

  const handleNoAddress = () => {
    setInputValue("");
    setValue("");
    setSelectedPlace(null);
    clearSuggestions();
  };

  return (
    <div className="items-center justify-center text-foreground bg-background">
      <label
        htmlFor="search-input"
        className="block pl-2 text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex justify-center my-2">
        <Command className="rounded-lg" shouldFilter={false}>
          <CommandInput
            placeholder="Search by address or postcode"
            value={inputValue || ""}
            onValueChange={(v) => {
              setInputValue(v);
              if (v === "") {
                handleNoAddress();
              } else {
                setInputValue(v);
                setValue(v);
              }
            }}
            className="block text-base"
          />

          {currentPosition ? (
            <CommandList>
              {status === "OK" && (
                <CommandGroup className="min-h-[100px">
                  <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
                    <CommandItem onSelect={() => handleSelectCurrentLocation()}>
                      {"Use current location"}
                    </CommandItem>
                    {data.map((prediction) => (
                      <CommandItem
                        key={prediction.place_id}
                        value={prediction.description}
                        onSelect={() =>
                          handleSelect(
                            prediction.place_id,
                            prediction.description
                          )
                        }>
                        {prediction.description}
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              )}
            </CommandList>
          ) : (
            <CommandList>
              {status === "OK" && (
                <CommandGroup>
                  <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
                    {data.map((prediction) => (
                      <CommandItem
                        key={prediction.place_id}
                        value={prediction.description}
                        onSelect={() =>
                          handleSelect(
                            prediction.place_id,
                            prediction.description
                          )
                        }>
                        {prediction.description}
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              )}
            </CommandList>
          )}
        </Command>
      </div>
    </div>
  );
};

export default LocationDrawer;
