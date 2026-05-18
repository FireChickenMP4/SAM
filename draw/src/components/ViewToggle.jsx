const VIEWS = [
  { key: 'transition', label: '转移边' },
  { key: 'suffix_link', label: '后缀链接' },
  { key: 'combined', label: '合并' },
];

export default function ViewToggle({ value, onChange }) {
  return (
    <>
      {VIEWS.map(v => (
        <button
          key={v.key}
          className={`btn btn-sm ${value === v.key ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => onChange(v.key)}
        >
          {v.label}
        </button>
      ))}
    </>
  );
}
