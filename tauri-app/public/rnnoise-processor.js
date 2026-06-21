class RNNoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input.length) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    for (let i = 0; i < inputChannel.length; i++) {
      // здесь будет RNNoise обработка
      outputChannel[i] = inputChannel[i];
    }

    return true;
  }
}

registerProcessor("rnnoise-processor", RNNoiseProcessor);
