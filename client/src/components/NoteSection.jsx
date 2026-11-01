
import NoteCard from "./NoteCard";

export default function NoteSection({
  title,
  notes,
  layout,
  dim,
  onEdit,
  onDelete,
  onTogglePin,
  isTrash = false,
  onRestore,
  onPermanentDelete,
}) {
  return (
    <section className="note-section" aria-label={title}>
      <h2 className="section-title">
        {title} <span className="section-count">{notes.length}</span>
      </h2>

      <div
        className={`grid ${layout === "list" ? "list" : ""} ${
          dim ? "dim" : ""
        }`}
      >
        {notes.map((note) => (
          <NoteCard
            key={note._id}
            note={note}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePin={onTogglePin}
            isTrash={isTrash}
            onRestore={onRestore}
            onPermanentDelete={onPermanentDelete}
          />
        ))}
      </div>
    </section>
  );
}
