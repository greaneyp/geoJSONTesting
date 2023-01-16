import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { createCustomEqual } from 'fast-equals';
import { isLatLngLiteral } from '@googlemaps/typescript-guards';
import ReactModal from 'react-modal';
import cannedData from './CannedData.json';
const render = (status: Status) => {
  return <h1>{status}</h1>;
};

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};
ReactModal.setAppElement('#root');
const App: React.VFC = () => {
  let defaultCenter = React.useState<google.maps.LatLngLiteral>({
    lat: 45.5152,
    lng: -122.6784,
  });
  const [clicks, setClicks] = React.useState<google.maps.LatLng[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [zoom, setZoom] = React.useState(10); // initial zoom
  const [center, setCenter] = defaultCenter;
  const [messageModalOpen, setMessageModalOpen] =
    React.useState<boolean>(false);

  const onIdle = (m: google.maps.Map) => {
    console.log('onIdle');
    setZoom(m.getZoom()!);
    setCenter(m.getCenter()!.toJSON());
    setClicks(cannedData.data);
  };

  const handleCloseModal = () => {
    setMessageModalOpen(false);
  };

  const resetZoomAndCenter = () => {
    setCenter(defaultCenter);
    setZoom(10);
  };
  const handleSearch = (e: any) => {
    setSearchTerm(e.target.value);
  };

  function search(items) {
    return items.filter((item) => {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }

  const handleContextMenu = (event) => {
    event.preventDefault();
    let objectIndex = event.currentTarget.getAttribute('id');
    console.log(clicks[objectIndex]);
    setCenter(clicks[objectIndex]);
    setZoom(12);
  };

  const form = (
    <div
      style={{
        padding: '1rem',
        flexBasis: '250px',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <button onClick={() => resetZoomAndCenter()}>
        Reset Zoom and Center
      </button>
      <label htmlFor="zoom">Search</label>
      <input
        type="text"
        id="Search"
        name="Search"
        onChange={(event) => handleSearch(event)}
      />
      <br />
      <h4>{clicks.length === 0 ? 'No Markers' : 'Markers'}</h4>
      {search(clicks).map((latLng, i) => (
        <pre
          id={i}
          key={i.toString()}
          onContextMenu={(event) => handleContextMenu(event)}
        >
          {latLng.name}
        </pre>
      ))}
    </div>
  );

  return (
    <div id="AppContainer" style={{ display: 'flex', height: '100%' }}>
      <Wrapper
        apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY!}
        render={render}
      >
        <Map
          center={center}
          onIdle={onIdle}
          zoom={zoom}
          style={{ flexGrow: '1', height: '100%' }}
        >
          {search(clicks).map((latLng, i) => (
            <Marker
              key={i}
              position={latLng}
              onClick={setMessageModalOpen}
              title={clicks[i].name}
            />
          ))}
        </Map>
      </Wrapper>
      {/* Basic form for controlling center and zoom of map. */}
      {form}
      <ReactModal
        isOpen={messageModalOpen}
        contentLabel="Example Modal"
        style={customStyles}
        onRequestClose={handleCloseModal}
        shouldCloseOnOverlayClick={true}
      >
        <h2>Hello</h2>
        <button onClick={handleCloseModal}>close</button>
        <div>I am a modal</div>
        <form>
          <input />
          <button>tab navigation</button>
          <button>stays</button>
          <button>inside</button>
          <button>the modal</button>
        </form>
      </ReactModal>
    </div>
  );
};
interface MapProps extends google.maps.MapOptions {
  style: { [key: string]: string };
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onIdle?: (map: google.maps.Map) => void;
  children?: React.ReactNode;
}

const Map: React.FC<MapProps> = ({
  onClick,
  onIdle,
  children,
  style,
  ...options
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<google.maps.Map>();

  React.useEffect(() => {
    if (ref.current && !map) {
      setMap(new window.google.maps.Map(ref.current, {}));
    }
  }, [ref, map]);

  // because React does not do deep comparisons, a custom hook is used
  // see discussion in https://github.com/googlemaps/js-samples/issues/946
  useDeepCompareEffectForMaps(() => {
    if (map) {
      map.setOptions(options);
    }
  }, [map, options]);

  React.useEffect(() => {
    if (map) {
      ['click', 'idle'].forEach((eventName) =>
        google.maps.event.clearListeners(map, eventName)
      );

      if (onClick) {
        map.addListener('click', onClick);
      }

      if (onIdle) {
        map.addListener('idle', () => onIdle(map));
      }
    }
  }, [map, onClick, onIdle]);

  return (
    <>
      <div ref={ref} style={style} />
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // set the map prop on the child component
          // @ts-ignore
          return React.cloneElement(child, { map });
        }
      })}
    </>
  );
};

interface MarkerProps extends google.maps.MarkerOptions {
  style: { [key: string]: string };
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onIdle?: (map: google.maps.Map) => void;
  onMouseOver?: (map: google.maps.Map) => void;
  children?: React.ReactNode;
}
const Marker: React.FC<MarkerProps> = ({
  onClick,
  onIdle,
  children,
  style,
  ...options
}) => {
  const [marker, setMarker] = React.useState<google.maps.Marker>();

  React.useEffect(() => {
    if (!marker) {
      setMarker(new google.maps.Marker());
    }
    if (marker && onClick) {
      google.maps.event.addListener(marker, 'click', onClick);
    }

    // remove marker from map on unmount
    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [marker]);

  React.useEffect(() => {
    if (marker) {
      marker.setOptions(options);
    }
  }, [marker, options]);

  return null;
};

const deepCompareEqualsForMaps = createCustomEqual(
  (deepEqual) => (a: any, b: any) => {
    if (
      isLatLngLiteral(a) ||
      a instanceof google.maps.LatLng ||
      isLatLngLiteral(b) ||
      b instanceof google.maps.LatLng
    ) {
      return new google.maps.LatLng(a).equals(new google.maps.LatLng(b));
    }

    // TODO extend to other types

    // use fast-equals for other objects
    return deepEqual(a, b);
  }
);

function useDeepCompareMemoize(value: any) {
  const ref = React.useRef();

  if (!deepCompareEqualsForMaps(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

function useDeepCompareEffectForMaps(
  callback: React.EffectCallback,
  dependencies: any[]
) {
  React.useEffect(callback, dependencies.map(useDeepCompareMemoize));
}

window.addEventListener('DOMContentLoaded', () => {
  const root = createRoot(document.getElementById('root')!);
  root.render(<App />);
});

export {};
