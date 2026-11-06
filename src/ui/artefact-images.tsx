import { useEffect, useRef, useState } from 'react';
import { Download, ImagePlus, Link, LoaderCircle, Maximize2, Unlink } from 'lucide-react';
import type { DeliveredImage } from '../contracts/artefact-images.js';
import type { PackageDraftView } from '../contracts/generation.js';

function ImageDialog({ image, onClose }: { image: DeliveredImage; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const current = dialog.current;
    if (current && !current.open) current.showModal();
    return () => current?.close();
  }, []);
  return (
    <dialog ref={dialog} className="image-dialog" aria-label={image.title} onClose={onClose}>
      <img
        src={`/api/artefact-images/${image.id}`}
        alt={image.title}
        width={image.width}
        height={image.height}
      />
      <form method="dialog">
        <button className="secondary">Close</button>
      </form>
    </dialog>
  );
}

// A participant-sized preview; the full image opens in a dialog or downloads unchanged.
export function ImageThumbnail({ image }: { image: DeliveredImage }) {
  const [open, setOpen] = useState(false);
  return (
    <figure className="image-thumb">
      <img
        src={`/api/artefact-images/${image.id}`}
        alt={image.title}
        width={image.width}
        height={image.height}
      />
      <figcaption>
        <button className="secondary" onClick={() => setOpen(true)}>
          <Maximize2 size={16} />
          Enlarge image
        </button>
        <a
          className="icon-button"
          href={`/api/artefact-images/${image.id}`}
          download={`${image.id}.png`}
          title="Download image"
          aria-label={`Download ${image.title}`}
        >
          <Download size={18} />
        </a>
      </figcaption>
      {open && <ImageDialog image={image} onClose={() => setOpen(false)} />}
    </figure>
  );
}

export function EvidenceImages({ images }: { images?: DeliveredImage[] }) {
  return images?.map((image) => (
    <figure className="evidence-image" key={image.id}>
      <img
        src={`/api/artefact-images/${image.id}`}
        alt={image.title}
        width={image.width}
        height={image.height}
      />
      <figcaption>
        <span>{image.title}</span>
        <a
          className="icon-button"
          href={`/api/artefact-images/${image.id}`}
          download={`${image.id}.png`}
          title="Download image"
          aria-label={`Download ${image.title}`}
        >
          <Download size={18} />
        </a>
      </figcaption>
    </figure>
  ));
}

export function ArtefactImageEditor({
  view,
  position,
  index,
  disabled,
  enabled,
  send,
}: {
  view: PackageDraftView;
  position: number;
  index: number;
  disabled: boolean;
  enabled: boolean;
  send: (command: { url: string; body: object }) => Promise<void>;
}) {
  const jobs = (view.imageRequests ?? []).filter(
    (job) => job.position === position && job.artefactIndex === index,
  );
  const latest = jobs.at(-1);
  const attached = view.draft.images?.find(
    (image) => image.position === position && image.artefactIndex === index,
  );
  const ready = jobs.filter((job) => job.status === 'ready' && job.current).at(-1);
  const display = ready?.image ?? attached?.image;
  const pending = view.imageRequests?.some((job) => ['queued', 'running'].includes(job.status));
  const command = () => ({
    commandId: crypto.randomUUID(),
    expectedRevision: view.draft.revision,
    expectedHash: view.hash,
    position,
    artefactIndex: index,
  });
  const title = view.draft.plan!.positions[position - 1]!.artefacts![index]!.headline;
  return (
    <section className="artefact-image-editor" aria-label={`Story message ${index + 1} image`}>
      {display && <EvidenceImages images={[{ ...display, title }]} />}
      {latest && (
        <p className={latest.status === 'failed' ? 'error' : 'muted'} role="status">
          {latest.status === 'queued'
            ? 'Queued for image worker.'
            : latest.status === 'running'
              ? 'Generating image...'
              : latest.status === 'failed'
                ? latest.error
                : !latest.current
                  ? 'Story message changed.'
                  : attached?.image.id === ready?.id
                    ? 'Image attached.'
                    : 'Image ready for review.'}
        </p>
      )}
      <div className="run-actions">
        <button
          className="secondary"
          disabled={disabled || !enabled || !!pending || (view.imageRequests?.length ?? 0) >= 10}
          onClick={() => {
            if (
              !window.confirm(
                'Generate one image from this saved story message using your Codex subscription? Review every word before attaching it.',
              )
            )
              return;
            void send({ url: `/api/packages/${view.draft.id}/images`, body: command() });
          }}
        >
          {pending ? <LoaderCircle size={16} className="spinner" /> : <ImagePlus size={16} />}{' '}
          Generate image
        </button>
        {ready?.image && attached?.image.id !== ready.id && (
          <button
            className="secondary"
            disabled={disabled}
            onClick={() => {
              if (
                !window.confirm(
                  'Attach this exact image after checking its text, claims, dates and recipients against the story message? The inject will need acceptance again.',
                )
              )
                return;
              void send({
                url: `/api/packages/${view.draft.id}/images/attach`,
                body: { ...command(), imageId: ready.id },
              });
            }}
          >
            <Link size={16} /> Attach image
          </button>
        )}
        {attached && (
          <button
            className="secondary"
            disabled={disabled}
            onClick={() =>
              void send({
                url: `/api/packages/${view.draft.id}/images/attach`,
                body: { ...command(), imageId: null },
              })
            }
          >
            <Unlink size={16} /> Remove image
          </button>
        )}
      </div>
    </section>
  );
}
