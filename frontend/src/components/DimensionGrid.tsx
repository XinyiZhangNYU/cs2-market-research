import type { Dimension } from '../contract/dimensions'
import { EnumChip } from './EnumChip'

// Each dimension gets its own cell. There is no aggregate score and no single colour
// standing in for the set, because the dimensions are orthogonal by contract.

export function DimensionGrid({ dimensions }: { dimensions: readonly Dimension[] }) {
  return (
    <div className="dimension-grid" data-testid="dimension-grid">
      {dimensions.map((dimension) => (
        <div className="dimension" key={dimension.field} data-field={dimension.field}>
          <div className="dimension__head">
            <code>{dimension.field}</code>
            <em>{dimension.title}</em>
          </div>
          <div className="dimension__values">
            {dimension.values.length > 0 ? (
              dimension.values.map((value) => (
                <EnumChip key={value.machine} machine={value.machine} label={value.label} />
              ))
            ) : (
              <span className="dimension__empty">{dimension.emptyNote ?? '—'}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
