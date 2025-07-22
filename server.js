const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001; // if we have to give port in environment variable then it choose that

// app.use(cors());
app.use(express.json());

// Initial points table data
const initialPointsTable = [
    {
        name: "Chennai Super Kings",
        matches: 7,
        won: 5,
        lost: 2,
        nrr: 0.771,
        runsFor: 1130,
        oversFor: 133.1,
        runsAgainst: 1071,
        oversAgainst: 138.5,
        points: 10
    },
    {
        name: "Royal Challengers Bangalore",
        matches: 7,
        won: 4,
        lost: 3,
        nrr: 0.597,
        runsFor: 1217,
        oversFor: 140,
        runsAgainst: 1066,
        oversAgainst: 131.4,
        points: 8
    },
    {
        name: "Delhi Capitals",
        matches: 7,
        won: 4,
        lost: 3,
        nrr: 0.319,
        runsFor: 1085,
        oversFor: 126,
        runsAgainst: 1136,
        oversAgainst: 137,
        points: 8
    },
    {
        name: "Rajasthan Royals",
        matches: 7,
        won: 3,
        lost: 4,
        nrr: 0.331,
        runsFor: 1066,
        oversFor: 128.2,
        runsAgainst: 1094,
        oversAgainst: 137.1,
        points: 6
    },
    {
        name: "Mumbai Indians",
        matches: 8,
        won: 2,
        lost: 6,
        nrr: -1.75,
        runsFor: 1003,
        oversFor: 155.2,
        runsAgainst: 1134,
        oversAgainst: 138.1,
        points: 4
    }
];

// A function convert over into total number of Balls
// Ex : 15.3 over - 93 balls
function oversToTotalBalls(overs) {
    const wholeOvers = Math.floor(overs);
    const balls = Math.round((overs - wholeOvers) * 10);
    return wholeOvers * 6 + balls;
}

// A function convert Ball to Total Overs
// Ex : 95 balls - 15.5 overs
function totalBallsToOvers(totalBalls) {
    const wholeOvers = Math.floor(totalBalls / 6);
    const balls = totalBalls % 6;
    return wholeOvers + (balls / 10);
}

// A function convert overs to it's decimal over 
// Ex : 15.5 overs - 15.833 decimal over
// It need for calculate the NRR
function convertOversToDecimal(overs) {
    const wholeOvers = Math.floor(overs);
    const balls = Math.round((overs - wholeOvers) * 10);
    return wholeOvers + balls / 6;
}

// A function which Search Team and Return whole team
function findTeam(teamName) {
    return initialPointsTable.find(team =>
        team.name.toLowerCase().includes(teamName.toLowerCase())
    );
}

// A Function for sort elements in descending
function sortTeamsByPointsAndNRR(a, b) {
    if (a.points !== b.points) {
        return b.points - a.points; // Higher points come first
    }
    return b.nrr - a.nrr; // If equal points, higher NRR comes first
}

// A function which update the team records(like : matchs , won, lost... )
function updateTeam(team, runsScored, runsAgainst, oversPlayed, oversOpponentPlayed, isWin) {
    return {
        ...team,
        matches: team.matches + 1,
        won: team.won + (isWin ? 1 : 0),
        lost: team.lost + (isWin ? 0 : 1),
        runsFor: team.runsFor + runsScored,
        oversFor: team.oversFor + oversPlayed,
        runsAgainst: team.runsAgainst + runsAgainst,
        oversAgainst: team.oversAgainst + oversOpponentPlayed,
        points: team.points + (isWin ? 2 : 0)
    };
}

// A function calculate the team Nate Run Rate with it's new score
function calculateNRR(updatedTeam) {
    const runRate = updatedTeam.runsFor / convertOversToDecimal(updatedTeam.oversFor);
    const runRateAgainst = updatedTeam.runsAgainst / convertOversToDecimal(updatedTeam.oversAgainst);
    return runRate - runRateAgainst;
}

// A function which check it's possible to User Team to reach the Desired Position Against Opponent Team
function canReachPosition(userTeam, oppositionTeam, userRuns, opponentRuns, userOvers, opponentOvers, desiredPosition) {
    // create a copy of points table 
    const updatedPointsTable = [...initialPointsTable];

    //update data records of  User Team
    const updatedUserTeam = updateTeam(userTeam, userRuns, opponentRuns, userOvers, opponentOvers, true);
    updatedUserTeam.nrr = calculateNRR(updatedUserTeam);

    //update data records of Opponent Team
    const updatedOppositionTeam = updateTeam(oppositionTeam, opponentRuns, userRuns, opponentOvers, userOvers, false);
    updatedOppositionTeam.nrr = calculateNRR(updatedOppositionTeam);

    //find original index of teams
    const userTeamIndex = updatedPointsTable.findIndex(team => team.name === userTeam.name);
    const opponentTeamIndex = updatedPointsTable.findIndex(team => team.name === oppositionTeam.name);

    //update all records of Teams
    updatedPointsTable[userTeamIndex] = updatedUserTeam;
    updatedPointsTable[opponentTeamIndex] = updatedOppositionTeam;

    //sort the points table according highest points team comes first if it have same points then decide position by the NRR
    const sortedTeams = updatedPointsTable.sort(sortTeamsByPointsAndNRR);
    // const sortedTeams = updatedPointsTable.sort((a, b) => {
    //     if (a.points !== b.points) {//check with points
    //         return b.points - a.points;
    //     }
    //     return b.nrr - a.nrr;//if points equal then check with nrr
    // });
    
    //get index of the user team
    const userTeamPosition = sortedTeams.findIndex(team => team.name === userTeam.name) + 1;

    return {
        canReach: userTeamPosition == desiredPosition,//true if desiredPosition is got else false
        currentPosition: userTeamPosition,
        updatedUserTeam
    };
}

//find the user team to defend how much run to win and also find the nrr
function calculateBattingFirst(userTeam, oppositionTeam, matchOvers, runsScored, desiredPosition) {
    let minOpponentRuns = 0;//we assume opposition team can defend at 0 runs so we can get max NRR
    let maxOpponentRuns = runsScored - 1; //if user need to win hence opposition team score = userRuns scored - 1
    //Ex : user scored 120 runs so user need to stop the opposition team at 119 run so it chance for win
    let results = [];//for storing the result 

    for (let opponentRuns = minOpponentRuns; opponentRuns <= maxOpponentRuns; opponentRuns++) {
        const result = canReachPosition(userTeam, oppositionTeam, runsScored, opponentRuns, matchOvers, matchOvers, desiredPosition);
        if (result.canReach) {
            results.push({
                opponentRuns,
                userNRR: result.updatedUserTeam.nrr,
                position: result.currentPosition
            });
        }
    }

    if (results.length === 0) {
        return {
            canReach: false,
            message: `Cannot reach position ${desiredPosition} with ${runsScored} runs in ${matchOvers} overs`
        };
    }
    let minValidOpponentRuns = Number.MAX_SAFE_INTEGER;
    let maxValidOpponentRuns = Number.MIN_SAFE_INTEGER;
    let minNRR = Number.MAX_SAFE_INTEGER;
    let maxNRR = Number.MIN_SAFE_INTEGER;

    results.forEach(element => {
        minValidOpponentRuns = Math.min(minValidOpponentRuns, element.opponentRuns);
        maxValidOpponentRuns = Math.max(maxValidOpponentRuns, element.opponentRuns);
        minNRR = Math.min(minNRR, element.userNRR);
        maxNRR = Math.max(maxNRR, element.userNRR);
    });

    return {
        canReach: true,
        minOpponentRuns: minValidOpponentRuns,
        maxOpponentRuns: maxValidOpponentRuns,
        minNRR: minNRR,
        maxNRR: maxNRR,
        results: results,
        scenario: 'batting'
    };
}

//find the user team Need to chase the runs in how many overs
function calculateBowlingFirst(userTeam, oppositionTeam, matchOvers, runsConceded, desiredPosition) {
    //runConceded Means runs scored by the opponent team
    const runsToChase = runsConceded + 1;//if user need to win hence it has to score +1 run 

    let minUserTeamBalls = 1;// Assume user team can chase run in 1 ball
    let maxUserTeamBalls = oversToTotalBalls(matchOvers); // max ball user team have 
    let results = [];

    for (let chaseBalls = minUserTeamBalls; chaseBalls <= maxUserTeamBalls; chaseBalls++) {
        const chaseOvers = totalBallsToOvers(chaseBalls);// convert balls to over because canReachPosition func has parameter in over not in balls

        const result = canReachPosition(
            userTeam,
            oppositionTeam,
            runsToChase,
            runsConceded,
            chaseOvers,
            matchOvers,
            desiredPosition
        );

        if (result.canReach) {
            results.push({
                chaseOvers: chaseOvers,
                userNRR: result.updatedUserTeam.nrr,
                position: result.currentPosition
            });
        }
    }

    if (results.length === 0) {
        return {
            canReach: false,
            message: `Cannot reach position ${desiredPosition} by chasing ${runsToChase} runs to beat ${runsConceded}`
        };
    }

    let minChaseOvers = Number.MAX_SAFE_INTEGER;
    let maxChaseOvers = Number.MIN_SAFE_INTEGER;
    let minNRR = Number.MAX_SAFE_INTEGER;
    let maxNRR = Number.MIN_SAFE_INTEGER

    results.forEach(element => {
        minChaseOvers = Math.min(minChaseOvers, element.chaseOvers);
        maxChaseOvers = Math.max(maxChaseOvers, element.chaseOvers);
        minNRR = Math.min(minNRR, element.userNRR);
        maxNRR = Math.max(maxNRR, element.userNRR);
    });

    return {
        canReach: true,
        minOversToChase: minChaseOvers,
        maxOversToChase: maxChaseOvers,
        minNRR: minNRR,
        maxNRR: maxNRR,
        results: results,
        runsToChase: runsToChase,
        scenario: 'bowling'
    };
}

// Routes

// Get current points table
app.get('/api/points-table', (req, res) => {
    try {

        const sortedTable = [...initialPointsTable].sort(sortTeamsByPointsAndNRR);
        res.json({
            success: true,
            data: sortedTable
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch points table'
        });
    }
});

// Calculate position requirements
app.post('/api/calculate', (req, res) => {
    try {
        const { userTeam, oppositionTeam, matchOvers, runs, desiredPosition, tossResult } = req.body;

        // Validate inputs
        if (!userTeam || !oppositionTeam || !runs || !desiredPosition || !tossResult) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        //user team and opposition team as same input then it's show error
        if (userTeam === oppositionTeam) {
            return res.status(400).json({
                success: false,
                error: 'User team and opposition team cannot be the same'
            });
        }

        //get user Team Data
        const userTeamData = findTeam(userTeam);
        //get opposition Team Data
        const oppositionTeamData = findTeam(oppositionTeam);

        //user Team not found then it's show error -- it's show Team __ not found error
        if (!userTeamData) {
            return res.status(400).json({
                success: false,
                error: `Team "${userTeam}" not found`
            });
        }

        //opposition Team not found then it's show error -- it's show Team __ not found error
        if (!oppositionTeamData) {
            return res.status(400).json({
                success: false,
                error: `Team "${oppositionTeam}" not found`
            });
        }

        //condition : should match overs greater than 0
        if (matchOvers <= 0) {
            return res.status(400).json({
                success: false,
                error: `Match Overs Should be Greater than 0, " ${matchOvers} " Invalid Input`
            })
        }
        //condition : should runs greater then 0
        if (runs <= 0) {
            return res.status(400).json({
                success: false,
                error: `Runs Should be Greater than 0, " ${runs} " Invalid Input`
            })
        }

        // Calculate result 
        let calculationResult;
        if (tossResult === 'batting') { // if chosen Batting
            calculationResult = calculateBattingFirst(
                userTeamData,
                oppositionTeamData,
                parseFloat(matchOvers),
                parseInt(runs),
                parseInt(desiredPosition)
            );
        } else { // if chosen bowling
            calculationResult = calculateBowlingFirst(
                userTeamData,
                oppositionTeamData,
                parseFloat(matchOvers),
                parseInt(runs),
                parseInt(desiredPosition)
            );
        }

        res.json({
            success: true,
            data: {
                ...calculationResult,
                userTeam: userTeamData.name,
                oppositionTeam: oppositionTeamData.name,
                matchOvers: parseFloat(matchOvers),
                desiredPosition: parseInt(desiredPosition),
                tossResult: tossResult,
                runs: parseInt(runs)
            }
        });

    } catch (error) {
        console.error('Calculation error:', error);
        res.status(500).json({
            success: false,
            error: 'Calculation failed'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Team Position Calculator API Server running on port ${PORT}`);
    console.log(`📊 Access points table: http://localhost:${PORT}/api/points-table`);
    console.log(`⚡ Calculate Api: http://localhost:${PORT}/api/calculate`);
});

module.exports = app;