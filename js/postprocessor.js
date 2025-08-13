// This object represent the postprocessor
Postprocessor = {
    // The postprocess function takes the audio samples data and the post-processing effect name
    // and the post-processing stage as function parameters. It gathers the required post-processing
    // paramters from the <input> elements, and then applies the post-processing effect to the
    // audio samples data of every channels.
    postprocess: function(channels, effect, pass) {
        switch(effect) {
            case "no-pp":
                // Do nothing
                break;

            case "reverse":
                /**
                * TODO: Complete this function
                **/

                // Post-process every channels
                for(var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;

                    // Apply the post-processing, i.e. reverse
                    audioSequence.data.reverse();

                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "boost":
                // Find the maximum gain of all channels
                var maxGain = -1.0;
                for(var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;
                    var gain = audioSequence.getGain();
                    if(gain > maxGain) {
                        maxGain = gain;
                    }
                }

                // Determin the boost multiplier
                var multiplier = 1.0 / maxGain;

                // Post-process every channels
                for(var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;

                    // For every sample, apply a boost multiplier
                    for(var i = 0; i < audioSequence.data.length; ++i) {
                        audioSequence.data[i] *= multiplier;
                    }

                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "adsr":
                /**
                * TODO: Complete this function
                **/

                let attackDuration;
                let holdDuration;
                let decayDuration;
                let releaseDuration;
                let sustainLevel;
                let holdLevel;

                let useGraph = $("#adsr-use-graph").prop("checked");

                for(var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;

                    if (useGraph) {
                        // let durationInSamples = duration * sampleRate;
                        let durationInSamples = audioSequence.data.length;
                        let graphData = window.adsrGraph.getDataPoints();
                        attackDuration = Math.floor(durationInSamples * graphData[1].x / 100);
                        holdDuration = Math.floor(durationInSamples * graphData[2].x / 100) - attackDuration;
                        decayDuration = Math.floor(durationInSamples * graphData[3].x / 100) - attackDuration - holdDuration;
                        releaseDuration = Math.floor(durationInSamples * (100 - graphData[4].x) / 100);
                        sustainLevel = graphData[3].y;
                        holdLevel = graphData[2].y;
                    } else {
                        // Obtain all the required parameters
                        attackDuration = parseFloat($("#adsr-attack-duration").data("p" + pass)) * sampleRate;
                        holdDuration = parseFloat($("#adsr-hold-duration").data("p" + pass)) * sampleRate;
                        decayDuration = parseFloat($("#adsr-decay-duration").data("p" + pass)) * sampleRate;
                        releaseDuration = parseFloat($("#adsr-release-duration").data("p" + pass)) * sampleRate;
                        sustainLevel = parseFloat($("#adsr-sustain-level").data("p" + pass)) / 100.0;
                        holdLevel = parseFloat($("#adsr-hold-level").data("p" + pass)) / 100.0;
                    }

                    for(var i = 0; i < audioSequence.data.length; ++i) {
                        // TODO: Complete the ADSR postprocessor
                        // Hinst: You can use the function lerp() in utility.js
                        // for performing linear interpolation

                        if (i < attackDuration) {
                            audioSequence.data[i] *= (holdLevel * i / attackDuration);
                            continue;
                        }

                        if (i < attackDuration + holdDuration) {
                            audioSequence.data[i] *= holdLevel;
                            continue;
                        }

                        if (i < attackDuration + holdDuration + decayDuration) {
                            const decayMultiplier = lerp(
                                sustainLevel, 
                                holdLevel, 
                                (attackDuration + holdDuration + decayDuration - 1 - i) / decayDuration
                            )
                            audioSequence.data[i] *= decayMultiplier
                            continue
                        }

                        if (i < audioSequence.data.length - releaseDuration) {
                            audioSequence.data[i] *= sustainLevel
                            continue;
                        }

                        const releaseMultiplier = lerp(
                            0, 
                            sustainLevel,
                            (audioSequence.data.length - 1 - i) / releaseDuration
                        );
                        audioSequence.data[i] *= releaseMultiplier;
                    }

                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "tremolo":
                /**
                * TODO: Complete this function
                **/

                // Obtain all the required parameters
                var tremoloFrequency = parseFloat($("#tremolo-frequency").data("p" + pass));
                var wetness = parseFloat($("#tremolo-wetness").data("p" + pass));

                // Post-process every channels
                for(var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;

                    // For every sample, apply a tremolo multiplier
                    for(var i = 0; i < audioSequence.data.length; ++i) {
                        const t = i / audioSequence.sampleRate;
                        const multiplier = ((Math.sin(2 * Math.PI * tremoloFrequency * t - Math.PI / 2) + 1) / 2) * wetness + (1 - wetness)
                        audioSequence.data[i] *= multiplier;
                    }

                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;

            case "echo":
                /**
                * TODO: Complete this function
                **/

                // Obtain all the required parameters
                var delayLineDuration = parseFloat($("#echo-delay-line-duration").data("p" + pass));
                var multiplier = parseFloat($("#echo-multiplier").data("p" + pass));

                // Post-process every channels
                for(var c = 0; c < channels.length; ++c) {
                    // Get the sample data of the channel
                    var audioSequence = channels[c].audioSequenceReference;

                    // Create a new empty delay line
                    const delayLineSize = parseInt(delayLineDuration * sampleRate);
                    const delayLine = [];
                    for (let i = 0; i < delayLineSize; ++i) delayLine.push(0);

                    // Get the sample data of the channel
                    for(var i = 0; i < audioSequence.data.length; ++i) {
                        // Get the echoed sample from the delay line
                        const delayLineOutput = delayLine[i % delayLineSize];

                        // Add the echoed sample to the current sample, with a multiplier
                        audioSequence.data[i] += (delayLineOutput * multiplier);

                        // Put the current sample into the delay line
                        delayLine[i % delayLineSize] = audioSequence.data[i];
                    }

                    // Update the sample data with the post-processed data
                    channels[c].setAudioSequence(audioSequence);
                }
                break;
            
            default:
                // Do nothing
                break;
        }
        return;
    }
}
