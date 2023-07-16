import React from 'react';

const CodeScope = ({ variable, value }: { variable: string; value: any }) => {
  return (
    <div>
      <span className="text-blue-500">{variable}</span> <span>:</span>{' '}
      <span className="text-purple-500">{value ?? '--'}</span>
    </div>
  );
};

export default CodeScope;
