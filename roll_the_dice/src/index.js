/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
             context.fail("Invalid Application ID");
        }
        */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("WhatDiceToUseIntent" === intentName) {
        setDiceTypeSession(intent, session, callback);
    } else if ("RollTheDiceIntent" === intentName) {
        getDiceRollSession(intent, session, callback);
    } else if ("WhatIsCurrDiceTypeIntent" === intentName) {
        getCurrDiceTypeSession(intent, session, callback);        
    } else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to Roll the Dice. " +
        "Please tell me what kind of dice roll you would like by saying, use dice 1 d 6";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Try saying, use 1 d 6";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */
function setDiceTypeSession(intent, session, callback) {
    var cardTitle = intent.name;
    var diceTypeSlot = intent.slots.DiceType;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (diceTypeSlot) {
        var diceType = diceTypeSlot.value;
        sessionAttributes = createDiceAttributes(diceType);
        
        speechOutput = "You picked " + diceType + ". You can ask me " + 
            "to roll the dice by saying, roll the dice?";
        repromptText = "You can change what kind of dice roll you would like by saying, change dice to 2 d 6?";
    } else {
        speechOutput = "I'm not sure what kind of dice roll you would like. Please try again";
        repromptText = "I'm not sure what kind of dice roll you would like. You can tell me kind of dice roll you would like " +
            "by saying, use dice 3 d 6";
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function createDiceAttributes(diceType) {
    return {
        diceType: diceType
    };
}

function rollDice(diceType) {
    var numOfDiceMap = {
        "one d four": 1,
        "one d six": 1,
        "two d six": 2,
        "three d six": 3,
        "one d eight": 1,
        "one d ten": 1,
        "two d ten": 2,
        "one d twelve": 1,
        "one d twenty": 1,
        "one d hundred": 1
    };
    var maxDiceNumMap = {
        "one d four": 4,
        "one d six": 6,
        "two d six": 6,
        "three d six": 6,
        "one d eight": 8,
        "one d ten": 10,
        "two d ten": 10,
        "one d twelve": 12,
        "one d twenty": 20,
        "one d hundred": 100
    };
    
    var numOfDice;
    var maxDiceNum;

    if (diceType in numOfDiceMap) {
        numOfDice = numOfDiceMap[diceType];
        maxDiceNum = maxDiceNumMap[diceType];
    } else {
        // default
        numOfDice = 1;
        maxDiceNum = 6;
    }   
    
    var totalRoll = 0;
    for(var i=0; i<numOfDice; i++) {
        totalRoll += Math.floor((Math.random() * maxDiceNum) + 1);    
    }
    
    return totalRoll;
}

function getDiceRollSession(intent, session, callback) {
    var diceType;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (session.attributes) {
        diceType = session.attributes.diceType;
        sessionAttributes = session.attributes;
    }

    if (diceType) {
        var totalRoll = rollDice(diceType);
        speechOutput = "Your roll is " + totalRoll + ".";
        // shouldEndSession = true;
    } else {
        speechOutput = "I'm not sure what of dice roll you would like, you can say, use dice 1 d 6.";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

function getCurrDiceTypeSession(intent, session, callback) {
    var diceType;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (session.attributes) {
        diceType = session.attributes.diceType;
        sessionAttributes = session.attributes;
    }

    if (diceType) {
        var totalRoll = rollDice(diceType);
        speechOutput = "Your dice is set to " + diceType + ".";
        // shouldEndSession = true;
    } else {
        speechOutput = "I'm not sure what of dice roll you would like, you can say, use dice 1 d 6.";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(session.attributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));    
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}