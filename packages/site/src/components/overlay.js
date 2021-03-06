/** @jsx jsx */
import { jsx } from 'theme-ui';
import Card from './card';

const Overlay = ({ state }) => {
  return (
    <Card>
      <h2>Your Overlay URL</h2>
      <p>
        Add the following URL as a browser source in your streaming software to
        enable Socket Studio sound effects.
      </p>
      <input
        type="url"
        value={`https://api.streamblitz.com/overlay?channel=${state.context.channel}`}
        disabled
        sx={{
          border: t => `1px solid ${t.colors.primary}`,
          borderRadius: 3,
          fontSize: 2,
          mb: 3,
          p: 2,
          width: '100%',
        }}
      />
    </Card>
  );
};

export default Overlay;
