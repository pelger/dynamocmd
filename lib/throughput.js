/* 
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED 
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES 
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, 
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES 
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, 
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING 
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
 * POSSIBILITY OF SUCH DAMAGE. 
 */     

var POLL_INTERVAL = 10 * 1000;



/**
 * adjust the dynamodb table throughput to the required values
 * this may require a number of jumps as dynamo only allows the
 * table throughput to be doubled in any one change
 */
exports.adjustTableThroughput = function(client, tableName, readUnits, writeUnits, callback) {
  readThroughput(client, tableName, function(err, tr) {
    if (err) {
      callback(err);
    }
    else {
      console.log("  Current: read=" + tr.read + ", write=" + tr.write + ", status= " + tr.stat + ", updated=" + new Date(tr.lastInc * 1000));
      if (tr.stat === "UPDATING") {
        setTimeout(function() {
          exports.adjustTableThroughput(client, tableName, readUnits, writeUnits, callback);
        }, POLL_INTERVAL);
      }
      else {
        var newRead = calculateJump(tr.read, readUnits);
        var newWrite = calculateJump(tr.write, writeUnits);

        if (newRead !== tr.read || newWrite !== tr.write) {
          var increaseDelta = (new Date()).getTime() - tr.lastInc * 1000;
          console.log("    Applying: read -> " + newRead + ", write -> " + newWrite);
          applyThroughput(client, tableName, readUnits, writeUnits, newRead, newWrite, callback);
        }
        else {
          callback(null);
        }
      }
    }
  });
};



/**
 * calcualte the jump this can be up to double the
 * curent provisioned value for increments, but direct to 
 * the exct value for decrements
 */
var calculateJump = function(provisioned, target) {
  var result;

  if (target <= provisioned)  {
    result = target;
  }
  else {
    var diff = Math.abs(provisioned - target);
    if (diff < provisioned) {
      result = target;
    }
    else {
      result = provisioned * 2;
    }
  }
  return Math.floor(result);
};



var applyThroughput = function(client, tableName, targetRead, targetWrite, newRead, newWrite, callback) {
  setThroughput(client, tableName, newRead, newWrite, function(err, data) {
    if (err) { 
      callback(err);
    }
    else {
      exports.adjustTableThroughput(client, tableName, targetRead, targetWrite, callback);
    }
  });
};



var setThroughput = function(client, tableName, readUnits, writeUnits, callback) {
  client.updateTable({TableName: tableName, ProvisionedThroughput: {ReadCapacityUnits: readUnits, WriteCapacityUnits: writeUnits}}, function(err, data){
    callback(err, data);
  });
};



var readThroughput = function(client, tableName, callback) {
  client.describeTable({TableName: tableName}, function(err, data) {
    if (!err) {
      callback(null, {read: data.Table.ProvisionedThroughput.ReadCapacityUnits, 
                      write: data.Table.ProvisionedThroughput.WriteCapacityUnits,
                      stat: data.Table.TableStatus,
                      lastInc: data.Table.ProvisionedThroughput.LastIncreaseDateTime});
    }
    else {
      callback(err, null);
    }

  });
};

