import { createContext, useContext } from 'react';

// Opens the cited record in the report's Records view; null outside a record report.
export const RevealRecord = createContext<((id: string) => void) | null>(null);

// Record IDs are "<kind>-<uuid>": show the kind and the first four characters.
function shortId(id: string) {
  const cut = id.indexOf('-');
  return cut < 1 ? id.slice(0, 12) : `${id.slice(0, cut)} ${id.slice(cut + 1, cut + 5)}`;
}

// Display only. Every cited line keeps its link and full record ID (title and accessible
// name); a line citing its own record shows a mark instead of repeating the ID.
export function Citation({ id, self = false }: { id: string; self?: boolean }) {
  const reveal = useContext(RevealRecord);
  return (
    <a
      className={self ? 'record-citation self' : 'record-citation'}
      href={'#record-' + id}
      title={id}
      aria-label={'Record ' + id}
      onClick={
        reveal
          ? (event) => {
              event.preventDefault();
              reveal(id);
            }
          : undefined
      }
    >
      {self ? '#' : `[${shortId(id)}]`}
    </a>
  );
}
