import React, { useState, useEffect } from 'react';
import {Container, Grid, Button, TextField, Box, Card, CardContent, Fab, Tooltip, IconButton} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(...registerables);
Chart.register(zoomPlugin);

type ChartData = Array<{
    x: number,
    y: number,
}>;

type ChartParams = {
    min: string,
    max: string,
    xOffset: string,
    yOffset: string,
    step: string,
    system: Array<{
        formula: string,
        condition: string,
    }>,
    color: string,
};

const App = () => {
    const [charts, setCharts] = useState<ChartParams[]>(() => {
        const savedCharts = localStorage.getItem('charts');
        return savedCharts ? JSON.parse(savedCharts) : [{
            min: '-50',
            max: '50',
            xOffset: '0',
            yOffset: '0',
            step: '0.3',
            system: [
                {
                    formula: '(Math.pow(x,3)/3) - (Math.exp(4*x)*Math.sin(Math.abs(Math.pow(1.3, 2) + Math.pow(x, 3)))) + 4/7',
                    condition: 'x>2 && x<7',
                }, {
                    formula: 'Math.cbrt(x) - 5',
                    condition: '(x < -5) && (x > -7)',
                }, {
                    formula: 'Math.pow(x,-10)',
                    condition: '',
                }
            ],
            color: 'red',
        }];
    });

    useEffect(() => {
        localStorage.setItem('charts', JSON.stringify(charts));
    }, [charts]);

    const addChart = () => {
        setCharts([...charts, {
            min: '',
            max: '',
            xOffset: '',
            yOffset: '',
            step: '',
            system: [{
                formula: '',
                condition: '',
            }],
            color: '',
        }]);
    };

    const removeChart = (index: number) => {
        setCharts(charts.filter((_, i) => i !== index));
    };

    const handleInputChange = (index: number, field: string, value: string) => {
        const newCharts = charts.map((chart, i) =>
            i === index ? { ...chart, [field]: value } : chart
        );
        setCharts(newCharts);
    };

    const addFormula = (chartIndex: number) => {
        const newCharts: ChartParams[] = charts.map((chart: ChartParams, i: number): ChartParams => {
            if (i === chartIndex) {
               return {
                   ...chart,
                   system: [
                       ...chart.system,
                       {
                           formula: '',
                           condition: '',
                       },
                   ]
               };
            }
            return chart;
        });
        setCharts(newCharts);
    }

    const removeFormula = (chartIndex, formulaIndex) => {
        const newCharts = charts.map((chart, i) =>
            i === chartIndex ? {
                ...chart,
                system: chart.system.filter((_, i) => i !== formulaIndex)
            } : chart
        );
        setCharts(newCharts);
    }

    const handleFormulaInputChange = (chartIndex, formulaIndex, field, value) => {
        const newCharts = charts.map((chart, i) =>
            i === chartIndex ? {
                ...chart,
                system: chart.system.map((formula, j) =>
                    j === formulaIndex ? {
                        ...formula,
                        [field]: value,
                    } : formula
                ),
            } : chart
        );
        setCharts(newCharts);
    };

        const calculateChartData = (chart: ChartParams): ChartData => {
            const { min, max, step, system, xOffset, yOffset } = chart;
            const data: ChartData = [];

            if (parseFloat(step) < 0.000001) {
                throw new Error('Step too small');
            }

            if (parseFloat(step) > (parseFloat(max) - parseFloat(min))) {
                throw new Error('Step too big');
            }

            for (let x = parseFloat(min); x <= parseFloat(max); x += parseFloat(step)) {
                const formula = system.find(formula => !formula.condition ? true : eval(formula.condition));
                if (!formula) {
                    continue;
                }
                const y: number = eval(formula.formula);
                data.push({
                    x: x + parseFloat(xOffset),
                    y: y + parseFloat(yOffset),
                });
            }

            return data;
        };

    const getLabels = (chart: ChartParams) => {
        const { min, max, step } = chart;
        const labels = [];
        for (let x = parseFloat(min); x <= parseFloat(max); x += parseFloat(step)) {
            labels.push(x);
        }
        return labels;
    }

    const calculateChartsData = () => {
        return {
            labels: charts?.length ? getLabels(charts[0]) : [],
            datasets: charts.map((chart) => {
                let data = [];
                try {
                    data = calculateChartData(chart);
                } catch (error) {
                    console.log(error);
                }

                return {
                    borderColor: chart.color,
                    fill: false,
                    data,
                };
            }),
        };
    }

    const renderCharts = () => {
        return (
            <Card
                style={{
                    padding: "10px",
                    margin: "12px",
                }}
            >
                <Line
                    data={calculateChartsData()}
                    options={({
                        aspectRatio: 1,
                        scales: {
                            x: {
                                type: 'linear',
                                position: 'center',
                                grid: {
                                    drawOnChartArea: true,
                                },
                                max: 30,
                                min: -30,
                            },
                            y: {
                                type: 'linear',
                                position: 'center',
                                grid: {
                                    drawOnChartArea: true,
                                },
                                max: 30,
                                min: -30,
                            },
                        },
                        plugins: {
                            legend: {
                                display: false,
                            },
                            zoom: {
                                zoom: {
                                    wheel: {
                                        enabled: true,
                                        modifierKey: 'ctrl',
                                    },
                                    pinch: {
                                        enabled: true
                                    },
                                    mode: 'xy',
                                },
                                pan: {
                                    enabled: true
                                },
                            }
                        },
                    })}
                />
            </Card>);
    };

    return (
        <Container>
            <Grid container spacing={0}>
                <Grid item xs={3} sm={3} xl={3} >
                    {charts.map((chart, index) => (
                        <Card
                            key={index}
                            style={{
                                padding: "10px",
                                margin: "12px 0 0",
                            }}
                        >
                            <CardContent>
                                <Grid container xs={12} sm={12} xl={12} title={"Точки"} spacing={1} style={{ padding: "0" }}>
                                    <Grid item xs={4} sm={4} xl={4}>
                                        <TextField
                                            label="Мін."
                                            value={chart.min}
                                            onChange={(e) => handleInputChange(index, 'min', e.target.value)}
                                            fullWidth
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={4} sm={4} xl={4}>
                                        <TextField
                                            label="Макс."
                                            value={chart.max}
                                            onChange={(e) => handleInputChange(index, 'max', e.target.value)}
                                            fullWidth
                                            margin="normal"
                                        />
                                    </Grid>
                                    <Grid item xs={4} sm={4} xl={4}>
                                        <TextField
                                            label="Крок"
                                            value={chart.step}
                                            onChange={(e) => handleInputChange(index, 'step', e.target.value)}
                                            fullWidth
                                            margin="normal"
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                            <Grid container xs={12} sm={12} xl={12} title={"Зсув"} spacing={1} style={{ padding: "0" }}>
                                <Grid item xs={6} sm={6} xl={6}>
                                    <TextField
                                        label="По осі X"
                                        value={chart.xOffset}
                                        onChange={(e) => handleInputChange(index, 'xOffset', e.target.value)}
                                        fullWidth
                                        margin="normal"
                                    />
                                </Grid>
                                <Grid item xs={6} sm={6} xl={6}>
                                    <TextField
                                        label="По осі Y"
                                        value={chart.yOffset}
                                        onChange={(e) => handleInputChange(index, 'yOffset', e.target.value)}
                                        fullWidth
                                        margin="normal"
                                    />
                                </Grid>
                            </Grid>
                            {chart.system.map((formula, formulaIndex) => (
                                <Box key={`${index}-${formulaIndex}`} mb={2}>
                                    <TextField
                                        label="Формула"
                                        value={formula.formula}
                                        onChange={(e) => handleFormulaInputChange(index, formulaIndex, 'formula', e.target.value)}
                                        fullWidth
                                        margin="normal"
                                    />
                                    <TextField
                                        label="Умова"
                                        value={formula.condition}
                                        onChange={(e) => handleFormulaInputChange(index, formulaIndex, 'condition', e.target.value)}
                                        fullWidth
                                        margin="normal"
                                    />
                                    <Tooltip title="Delete">
                                        <IconButton onClick={() => removeFormula(index, formulaIndex)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            ))}
                            <Button variant="contained" color="primary" onClick={() => addFormula(index)}>Додати формулу</Button>
                            <TextField
                                label="Колір"
                                type="color"
                                value={chart.color}
                                onChange={(e) => handleInputChange(index, 'color', e.target.value)}
                                fullWidth
                                margin="normal"
                            />
                            <Button variant="contained" color="error" onClick={() => removeChart(index)}>Видалити</Button>
                        </Card>
                    ))}
                </Grid>
                <Grid item xs={9} sm={9} xl={9}>
                    {renderCharts()}
                    <div style={{
                        textAlign: "right",
                        margin: "100px 0 0",
                    }}>
                        <Fab
                            color="primary"
                            aria-label="Додати графік"
                            onClick={addChart}
                        >
                            <AddIcon />
                        </Fab>
                    </div>
                </Grid>
            </Grid>
        </Container>
    );
};

export default App;