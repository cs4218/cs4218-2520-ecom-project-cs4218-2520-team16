const React = require("react");

const mockRequestPaymentMethod = jest
  .fn()
  .mockResolvedValue({ nonce: "fake-nonce" });

let skipInstanceCallback = false;

function setSkipInstanceCallback(value) {
  skipInstanceCallback = Boolean(value);
}

function MockDropIn({ onInstance }) {
  React.useEffect(() => {
    if (!skipInstanceCallback && onInstance) {
      onInstance({
        requestPaymentMethod: mockRequestPaymentMethod,
      });
    }
  }, [onInstance]);
  return React.createElement(
    "div",
    { "data-testid": "braintree-dropin" },
    React.createElement("div", { "data-testid": "dropin" }, "Payment Form")
  );
}

MockDropIn.mockRequestPaymentMethod = mockRequestPaymentMethod;
MockDropIn.setSkipInstanceCallback = setSkipInstanceCallback;

module.exports = MockDropIn;
