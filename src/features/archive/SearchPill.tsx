import { Icon } from '../../components/Icon';

type Props = { query: string; onChange: (value: string) => void };

export function SearchPill({ query, onChange }: Props) {
  return (
    <label className="search">
      <Icon name="search" />
      <input
        aria-label="기록에서 찾아보기"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="기록에서 찾아보기"
      />
    </label>
  );
}
