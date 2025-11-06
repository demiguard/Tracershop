import { jest, expect, describe, it } from '@jest/globals'
import { render } from '@testing-library/react';
import { IsotopeTable } from '~/components/production_pages/isotope_table';
import { TracerShopContext } from '~/contexts/tracer_shop_context';
import { ProductReference } from '~/dataclasses/references/product_reference';
import { testState } from '~/tests/app_state';
import { isotopes } from '~/tests/test_state/isotopes';

describe("Production isotope table test suite", () => {
  function getProduct(){
    return ProductReference.fromProduct(isotopes.get(1));
  }

  it("Standard Render 3", () => {
    const product = getProduct();

    /*
    render(
      <TracerShopContext tracershop_state={testState} websocket={}>
        <IsotopeTable product={product} />
      </TracerShopContext>
    )
    */


  })
});