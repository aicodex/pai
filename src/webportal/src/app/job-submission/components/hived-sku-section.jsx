// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useCallback, useContext, useMemo } from 'react';
import { get, isEmpty } from 'lodash';
import { Dropdown, Stack } from 'office-ui-fabric-react';
import PropTypes from 'prop-types';
import { BasicSection } from './basic-section';
import { CSpinButton } from './customized-components';
import { FormShortSection } from './form-page';
import { PROTOCOL_TOOLTIPS } from '../utils/constants';
import Context from './context';

export const HivedSkuSection = React.memo(props => {
  const { value, onChange } = props;
  const { skuNum, skuType } = value;
  const { hivedSkuTypes } = useContext(Context);
  const { skuLimit } = useContext(Context);
  const skuWeight = {"gpu-machine-a100-1t":1,"gpu-machine-a100-2t":1,"gpu-machine-3090":0.25};

  const skuOptions = useMemo(
    () =>
      Object.entries(hivedSkuTypes).reduce((options, skuType) => {
        const [name, { gpu, cpu, memory }] = skuType;
        return [
          ...options,
          {
            key: name,
            sku: { gpu, cpu, memory },
            text: `${name} (${gpu} GPU, ${cpu} CPU, ${memory} memory)`,
          },
        ];
      }, []),
    [hivedSkuTypes],
  );

  const _setSku = () => {
    if (value.skuType != null) {
      const selected = skuOptions.find(option => option.key === value.skuType);
      if (selected == null) {
        onChange({ ...value, skuType: null, sku: null, skuNum: 1, });
      } else if (value.sku == null) {
        onChange({ ...value, sku: get(selected, 'sku', null), skuNum: 1, });
      }
    } else if (!isEmpty(skuOptions)) {
      onChange({
        ...value,
        skuType: skuOptions[0].key,
        sku: skuOptions[0].sku,
        skuNum: 1,
      });
    }
  };

  const _onSkuNumChange = useCallback(
    num => {
      onChange({
        ...value,
        skuNum: num,
      });
    },
    [onChange],
  );

  const _onSkuTypeChange = useCallback(
    (_, item) => {
      onChange({
        ...value,
        skuType: item.key,
        sku: item.sku,
      });
    },
    [onChange],
  );

  _setSku();
  return (
    <BasicSection
      sectionLabel='Resources SKU'
      sectionTooltip={PROTOCOL_TOOLTIPS.hivedSkuType}
    >
      <FormShortSection gap='m'>
        <Stack horizontal verticalAlign='baseline'>
          <div style={{ width: '20%' }}>SKU count</div>
          <Stack.Item grow>
            <CSpinButton value={skuNum} min={1} max={skuWeight && skuType && skuWeight[skuType] ? parseInt(parseFloat(skuLimit) / skuWeight[skuType]) : parseInt(skuLimit)} onChange={_onSkuNumChange} />
          </Stack.Item>
        </Stack>
        <Stack horizontal verticalAlign='baseline'>
          <div style={{ width: '20%' }}>SKU type</div>
          <Stack.Item grow>
            <Dropdown
              placeholder='Select SKU type'
              options={skuOptions}
              onChange={_onSkuTypeChange}
              selectedKey={skuType}
            />
          </Stack.Item>
        </Stack>
      </FormShortSection>
    </BasicSection>
  );
});

HivedSkuSection.propTypes = {
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func,
};
