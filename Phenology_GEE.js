// In this exercise we will practically involve what we learn 
// theoretical part of harmonic time series analysis, trigonometric equations, linear regression.
// the purpose is to display the phenology stages in a map using MODIS/MoD13A1 data set.
// the brief description of theory is included in my docs file :
// https://docs.google.com/document/d/1a0Cozi1GfD1WAkZzNgvDcsT6-4Cnss8RQje9gUTSo5s/edit?usp=sharing


// first let's get to the dataset and put it in a variable c.
// EVI is selected since it is enhanced version of vegetation index. More in docs.
var c = ee.ImageCollection("MODIS/061/MOD13A1").select('EVI');


// func is created to calculate independent variables and also to create a stack of images and range it into 0 to 1.
// this func is basically to fulfill the EVI equation to fit in linear regression more in docs.
function addIndependentVariables(image){
  var date = ee.Date(image.get('system:time_start'));
  var time = date.difference(ee.Date('2000-01-01'),'year');
  var sin = time.multiply(2* Math.PI).sin();
  var cos = time.multiply(2 * Math.PI).cos();
  var independents = ee.Image([sin, cos, time ,1]).double();
  return independents.addBands(image.divide(10000));
}

// reg variable is created when the imageCollection is mapped into function we just created
// which is further fitted or reduced into linear regression
var reg = c.map(addIndependentVariables)
          .reduce(ee.Reducer.linearRegression(4)) // according to GEE docs: LinearRegression is provided by number of independent variables
          .select('coefficients') // selecting coefficients fro the ouput : coefficients and residuals. since we need coeff.
          .arrayProject([0]) // dimensional reduction for array manipulation. You can print(reg) till here to see how it may work.
          .arrayFlatten([['sin', 'cos', 'slope', 'offset']]); //flattening the array and creating new image of bands sin, cos, slope and offset

// below code can be run to see the output in console for better understanding
//print(reg);
//Map.addLayer(reg,{},'reg');


// selecting the required bands precisely in to the variables
var sin = reg.select('sin');
var cos = reg.select('cos');
var slope = reg.select('slope');
var offset = reg.select('offset');


//This below calculations are briefly explained in docs.
var sat = cos.hypot(sin).multiply(2.5); // multiplying by 2.5 to scale the saturation for visibility
var hue = sin.atan2(cos).unitScale(-Math.PI,Math.PI); //normalizes phase angle [0,1],
var val = offset.multiply(1.5); // scales the value for better visualization contrast.

var seasonality = ee.Image.cat(hue,sat,val).hsvToRgb(); //the arrays of hue,sat,val are concatenated with axis =1, and then converted into rgb

// adding a layer into a map for visualization
Map.addLayer(seasonality,{},'seasonality');



