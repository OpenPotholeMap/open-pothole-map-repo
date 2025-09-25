import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

const LocationDrawer = ({
  userLocation,
  selectedOrigin,
  selectedDestination,
  setSelectedOrigin,
  setSelectedDestination,
}: {
  userLocation: { lat: number; lng: number } | null;
  selectedOrigin: { lat: number; lng: number; address?: string } | null;
  selectedDestination: { lat: number; lng: number; address?: string } | null;
  setSelectedOrigin: (
    origin: { lat: number; lng: number; address?: string } | null
  ) => void;
  setSelectedDestination: (
    destination: { lat: number; lng: number; address?: string } | null
  ) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 right-6 z-10">
      <Drawer open={open} onOpenChange={setOpen} repositionInputs={false}>
        <DrawerTrigger asChild>
          <Button className="w-full rounded-md border px-3 py-2 shadow cursor-pointer text-background bg-foreground">
            Going somewhere?
          </Button>
        </DrawerTrigger>

        <DrawerContent className="h-[450px]">
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
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

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
      console.log("Selected place changed:", selectedPlace);
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

    console.log("Geocoded location:", { lat, lng, address });
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
