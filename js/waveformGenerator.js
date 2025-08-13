// This object represent the waveform generator
var WaveformGenerator = {
    // The generateWaveform function takes 4 parameters:
    //     - type, the type of waveform to be generated
    //     - frequency, the frequency of the waveform to be generated
    //     - amp, the maximum amplitude of the waveform to be generated
    //     - duration, the length (in seconds) of the waveform to be generated
    generateWaveform: function(type, frequency, amp, duration) {
        var nyquistFrequency = sampleRate / 2; // Nyquist frequency
        var totalSamples = Math.floor(sampleRate * duration); // Number of samples to generate
        var result = []; // The temporary array for storing the generated samples

        const samplesPerCycle = sampleRate / frequency;
        const samplesPerHalfCycle = samplesPerCycle / 2;
        let whereInCycle;
        let additiveWaves = Math.floor(nyquistFrequency / frequency);

        switch(type) {
            case "sine-time": // Sine wave, time domain
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    result.push(amp * Math.sin(2.0 * Math.PI * frequency * currentTime));
                }
                break;

            case "square-time": // Square wave, time domain
                /**
                * TODO: Complete this generator
                **/
                for (var i = 0; i < totalSamples; ++i) {
                    whereInCycle = i % parseInt(samplesPerCycle);
                    result.push(
                        amp * (whereInCycle < samplesPerHalfCycle ? 1 : -1)
                    )
                }
                break;

            case "square-additive": // Square wave, additive synthesis
                /**
                * TODO: Complete this generator
                **/
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    let sample = 0;
                    for (let j = 1; j <= additiveWaves; j += 2) {
                        sample += (1.0 / j) * Math.sin(2.0 * Math.PI * j * frequency * currentTime)
                    }
                    result.push(amp * sample)
                }
                break;

            case "sawtooth-time": // Sawtooth wave, time domain
                /**
                * TODO: Complete this generator
                **/
                for (var i = 0; i < totalSamples; ++i) {
                    whereInCycle = i % parseInt(samplesPerCycle);
                    result.push(
                        amp * (samplesPerHalfCycle - whereInCycle) / samplesPerHalfCycle
                    )
                }
                break;

            case "sawtooth-additive": // Sawtooth wave, additive synthesis
                /**
                * TODO: Complete this generator
                **/
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    let sample = 0;
                    for (let j = 1; j <= additiveWaves; j++) {
                        sample += (1.0 / j) * Math.sin(2.0 * Math.PI * j * frequency * currentTime)
                    }
                    result.push(amp * sample)
                }
                break;

            case "triangle-additive": // Triangle wave, additive synthesis
                /**
                * TODO: Complete this generator
                **/
                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    let sample = 0;
                    for (let j = 1; j <= additiveWaves; j += 2) {
                        sample += (1.0 / (j * j)) * Math.cos(2.0 * Math.PI * j * frequency * currentTime)
                    }
                    result.push(amp * sample)
                }
                break;

            case "customized-additive-synthesis": // Customized additive synthesis
                /**
                * TODO: Complete this generator
                **/

                // Obtain all the required parameters
				var harmonics = [];
				for (var h = 1; h <= 10; ++h) {
					harmonics.push($("#additive-f" + h).val());
				}

                for (var i = 0; i < totalSamples; ++i) {
                    var currentTime = i / sampleRate;
                    let sample = 0;
                    for (let j = 1; j <= Math.min(additiveWaves, harmonics.length); j++) {
                        sample += parseFloat(harmonics[j - 1]) * Math.sin(2.0 * Math.PI * j * frequency * currentTime)
                    }
                    result.push(amp * sample)
                }

                break;

            case "white-noise": // White noise
                /**
                * TODO: Complete this generator
                **/
                for (var i = 0; i < totalSamples; ++i) {
                    result.push(amp * (Math.random() * 2 - 1))
                }
                break;

            case "karplus-strong": // Karplus-Strong algorithm
                /**
                * TODO: Complete this generator
                **/

                // Obtain all the required parameters
                var base = $("#karplus-base>option:selected").val();
                var b = parseFloat($("#karplus-b").val());
                var delay = $("#karplus-use-freq").prop("checked") ? 
                    parseInt(sampleRate / frequency) :
                    parseInt($("#karplus-p").val());
                
                for (var i = 0; i < totalSamples; ++i) {
                    if (i <= delay) {
                        if (base == "white-noise") {
                            result.push(amp * (2 * Math.random() - 1));
                        } else if (base == "sawtooth") {
                            whereInCycle = i % delay;
                            result.push(amp * (delay / 2 - whereInCycle) / (delay / 2))
                        }
                    } else {
                        const multiplier = Math.random() < b ? 0.5 : -0.5;
                        result.push(multiplier * (result[i - delay] + result[i - delay - 1]));
                    }
                }

                break;

            case "fm": // FM
                /**
                * TODO: Complete this generator
                **/

                // Obtain all the required parameters
                var carrierFrequency = parseInt($("#fm-carrier-frequency").val());
                var carrierAmplitude = parseFloat($("#fm-carrier-amplitude").val());
                var modulationFrequency = parseInt($("#fm-modulation-frequency").val());
                var modulationAmplitude = parseFloat($("#fm-modulation-amplitude").val());
                var useADSR = $("#fm-use-adsr").prop("checked");
                if(useADSR) { // Obtain the ADSR parameters
                    var attackDuration = parseFloat($("#fm-adsr-attack-duration").val()) * sampleRate;
                    var decayDuration = parseFloat($("#fm-adsr-decay-duration").val()) * sampleRate;
                    var releaseDuration = parseFloat($("#fm-adsr-release-duration").val()) * sampleRate;
                    var sustainLevel = parseFloat($("#fm-adsr-sustain-level").val()) / 100.0;
                }

                if ($("#fm-use-freq-multiplier").prop("checked")) {
                    carrierFrequency = frequency * parseFloat($("#fm-carrier-frequency").val());
                    modulationFrequency = frequency * parseFloat($("#fm-modulation-frequency").val())
                }

                for (var i = 0; i < totalSamples; ++i) {
                    let modulationAmplitudeTemp = modulationAmplitude;
                    if(useADSR) {
                        if (i < attackDuration) {
                            modulationAmplitudeTemp *= (i / attackDuration);
                        } else if (i < attackDuration + decayDuration) {
                            modulationAmplitudeTemp *= lerp(
                                sustainLevel, 
                                1, 
                                (attackDuration + decayDuration - 1 - i) / decayDuration
                            );
                        } else if (i < totalSamples - releaseDuration) {
                            modulationAmplitudeTemp = modulationAmplitude * sustainLevel;
                        } else {
                            modulationAmplitudeTemp *= lerp(
                                0, 
                                sustainLevel,
                                (totalSamples - 1 - i) / releaseDuration
                            )
                        }
                    }

                    var currentTime = i / sampleRate;
                    const modulator = modulationAmplitudeTemp * 
                        Math.sin(2.0 * Math.PI * modulationFrequency * currentTime)
                    result.push(
                        amp * carrierAmplitude * Math.sin(2.0 * Math.PI * carrierFrequency * currentTime + modulator)
                    )
                }

                break;

            case "repeating-narrow-pulse": // Repeating narrow pulse
                var cycle = Math.floor(sampleRate / frequency);
                for (var i = 0; i < totalSamples; ++i) {
                    if(i % cycle === 0) {
                        result.push(amp * 1.0);
                    } else if(i % cycle === 1) {
                        result.push(amp * -1.0);
                    } else {
                        result.push(0.0);
                    }
                }
                break;

            default:
                break;
        }

        return result;
    }
};
