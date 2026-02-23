import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { getBookings } from '../../../api/client';
import { useInfiniteScroll } from '../../../../hooks/useInfiniteScroll';
import DateFilterModal from '../../../../components/DateFilterModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const C = { bg:'#F7FAFC', surface:'#FFFFFF', text:'#1E293B', subtext:'#475569', muted:'#94A3B8', border:'#E2E8F0', brand:'#3B82F6', green:'#10B981', orange:'#F59E0B', red:'#EF4444', purple:'#8B5CF6' };

const STATUS_CONFIG = {
  PENDING_PAYMENT:  { label:'Payment Pending',   color:C.orange },
  PAYMENT_SUBMITTED:{ label:'Payment Submitted',  color:C.orange },
  ADVANCE_PAID:     { label:'Advance Paid',       color:C.green  },
  CONFIRMED:        { label:'Confirmed',          color:C.green  },
  DRIVER_ASSIGNED:  { label:'Driver Assigned',    color:C.brand  },
  IN_PROGRESS:      { label:'In Progress',        color:C.purple },
  COMPLETED:        { label:'Completed',          color:'#059669'},
  CANCELLED:        { label:'Cancelled',          color:C.red    },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '--';

export default function LuxuryBookingsScreen({ navigation, route }) {
  const { filter } = route.params || {};
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const { data:bookings, loading, refreshing, hasMore, loadMore, refresh, initialLoad, applyDateFilter, dateFilter } =
    useInfiniteScroll(getBookings, { service:'luxury', type: filter || 'bookings' });

  useEffect(() => { initialLoad(); }, [initialLoad]);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === id ? null : id);
  };

  const renderBooking = ({ item }) => {
    const sc = STATUS_CONFIG[item.status] || { label:item.status, color:C.muted };
    const isExpanded = expandedId === item.id;
    return (
      <View style={s.card}>
        <TouchableOpacity activeOpacity={0.8} onPress={()=>navigation.navigate('LuxuryBookingDetail',{bookingId:item.id,serviceType:'luxury'})}>
          <View style={s.cardTop}>
            <View style={s.cardTopLeft}>
              <Text style={s.num}>#{item.bookingNumber}</Text>
              {item.tripType && <Text style={s.chip}>{item.tripType.replace(/_/g,' ')}</Text>}
              {item.occasion && <Text style={[s.chip,{backgroundColor:'#FDF4FF',color:'#9333EA'}]}>{item.occasion}</Text>}
            </View>
            <View style={[s.badge,{backgroundColor:sc.color+'20'}]}><Text style={[s.badgeText,{color:sc.color}]}>{sc.label}</Text></View>
          </View>
          <View style={s.body}>
            <View style={s.row}><Icon name="user" size={14} color={C.muted}/><Text style={s.rowText} numberOfLines={1}>{item.customerName}</Text></View>
            <View style={s.routeRow}>
              <View style={s.routeStop}><View style={[s.dot,{backgroundColor:C.green}]}/><Text style={s.routeCity} numberOfLines={1}>{item.pickupCity||'--'}</Text></View>
              <View style={s.routeLine}/>
              <View style={s.routeStop}><View style={[s.dot,{backgroundColor:C.red}]}/><Text style={s.routeCity} numberOfLines={1}>{item.dropCity||'Local'}</Text></View>
            </View>
            <View style={s.row}><Icon name="calendar" size={14} color={C.muted}/><Text style={s.rowText}>{fmt(item.pickupDate)}{item.pickupTime?`  ${item.pickupTime.slice(0,5)}`:''}</Text></View>
          </View>
          <View style={s.footer}>
            <View><Text style={s.amtLabel}>Total Amount</Text><Text style={s.amt}>₹{(item.totalAmount||0).toLocaleString('en-IN')}</Text></View>
            <View style={s.footerRight}>
              <TouchableOpacity style={s.expandBtn} onPress={()=>toggleExpand(item.id)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Icon name={isExpanded?'chevron-up':'chevron-down'} size={16} color={C.muted}/>
              </TouchableOpacity>
              <Icon name="chevron-right" size={18} color={C.brand}/>
            </View>
          </View>
        </TouchableOpacity>
        {isExpanded && (
          <View style={s.expanded}>
            <View style={s.expandDivider}/>
            {item.vehicleName && <View style={s.eRow}><Icon name="star" size={13} color={C.muted}/><Text style={s.eLabel}>Vehicle</Text><Text style={s.eVal}>{item.vehicleName}</Text></View>}
            {item.vehicleCategoryName && <View style={s.eRow}><Icon name="tag" size={13} color={C.muted}/><Text style={s.eLabel}>Category</Text><Text style={s.eVal}>{item.vehicleCategoryName}</Text></View>}
            {item.pickupAddress && <View style={s.eRow}><Icon name="map-pin" size={13} color={C.green}/><Text style={s.eLabel}>Pickup Addr.</Text><Text style={s.eVal}>{item.pickupAddress}</Text></View>}
            {item.dropAddress && <View style={s.eRow}><Icon name="map-pin" size={13} color={C.red}/><Text style={s.eLabel}>Drop Addr.</Text><Text style={s.eVal}>{item.dropAddress}</Text></View>}
            {item.returnDate && <View style={s.eRow}><Icon name="calendar" size={13} color={C.muted}/><Text style={s.eLabel}>Return</Text><Text style={s.eVal}>{fmt(item.returnDate)}</Text></View>}
            {item.needDecoration && <View style={s.eRow}><Icon name="gift" size={13} color={C.purple}/><Text style={s.eLabel}>Decoration</Text><Text style={[s.eVal,{color:C.purple}]}>Requested</Text></View>}
            {item.needChauffeur && <View style={s.eRow}><Icon name="user-check" size={13} color={C.brand}/><Text style={s.eLabel}>Chauffeur</Text><Text style={[s.eVal,{color:C.brand}]}>Required</Text></View>}
            {item.driverName && <View style={s.eRow}><Icon name="user-check" size={13} color={C.green}/><Text style={s.eLabel}>Driver</Text><Text style={[s.eVal,{color:C.green}]}>{item.driverName}</Text></View>}
            <TouchableOpacity style={s.viewBtn} onPress={()=>navigation.navigate('LuxuryBookingDetail',{bookingId:item.id,serviceType:'luxury'})}>
              <Text style={s.viewBtnText}>View Full Details</Text><Icon name="arrow-right" size={14} color={C.brand}/>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={s.backBtn}><Icon name="arrow-left" size={22} color={C.text}/></TouchableOpacity>
        <Text style={s.headerTitle}>Luxury Bookings</Text>
        <TouchableOpacity onPress={()=>setShowDateFilter(true)} style={s.filterBtn}>
          <Icon name="calendar" size={20} color={dateFilter.start?C.brand:C.muted}/>
          {dateFilter.start && <View style={s.filterDot}/>}
        </TouchableOpacity>
      </View>
      {loading && bookings.length===0 ? (
        <View style={s.centered}><ActivityIndicator size="large" color={C.brand}/></View>
      ) : (
        <FlatList data={bookings} renderItem={renderBooking} keyExtractor={i=>i.id} contentContainerStyle={s.list}
          onEndReached={loadMore} onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[C.brand]}/>}
          ListFooterComponent={loading&&hasMore?<View style={{paddingVertical:20}}><ActivityIndicator size="small" color={C.brand}/></View>:null}
          ListEmptyComponent={<View style={s.empty}><Icon name="inbox" size={48} color={C.muted}/><Text style={s.emptyTitle}>No luxury bookings</Text><Text style={s.emptySub}>Confirmed bookings will appear here</Text></View>}
        />
      )}
      <DateFilterModal visible={showDateFilter} onClose={()=>setShowDateFilter(false)} onApply={(st,e,t)=>applyDateFilter(st,e,t)} currentStartDate={dateFilter.start} currentEndDate={dateFilter.end} currentFilterType={dateFilter.type}/>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg}, centered:{flex:1,justifyContent:'center',alignItems:'center'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12,backgroundColor:C.surface,borderBottomWidth:1,borderBottomColor:C.border},
  backBtn:{width:40,height:40,justifyContent:'center',alignItems:'center'}, headerTitle:{fontSize:18,fontWeight:'600',color:C.text},
  filterBtn:{width:40,height:40,justifyContent:'center',alignItems:'center',position:'relative'},
  filterDot:{position:'absolute',top:8,right:8,width:8,height:8,borderRadius:4,backgroundColor:C.brand},
  list:{padding:16,gap:12},
  card:{backgroundColor:C.surface,borderRadius:14,borderWidth:1,borderColor:C.border,overflow:'hidden'},
  cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',paddingHorizontal:14,paddingTop:14,paddingBottom:10},
  cardTopLeft:{flexDirection:'row',alignItems:'center',gap:6,flex:1,flexWrap:'wrap'},
  num:{fontSize:15,fontWeight:'700',color:C.text},
  chip:{fontSize:11,color:C.brand,backgroundColor:'#EFF6FF',paddingHorizontal:7,paddingVertical:2,borderRadius:6,fontWeight:'600',textTransform:'capitalize'},
  badge:{paddingHorizontal:10,paddingVertical:4,borderRadius:12}, badgeText:{fontSize:11,fontWeight:'700'},
  body:{paddingHorizontal:14,gap:8},
  row:{flexDirection:'row',alignItems:'center',gap:6}, rowText:{fontSize:13,color:C.subtext,flex:1},
  routeRow:{flexDirection:'row',alignItems:'center',gap:6},
  routeStop:{flexDirection:'row',alignItems:'center',gap:5,flex:1},
  dot:{width:8,height:8,borderRadius:4}, routeCity:{fontSize:13,color:C.text,fontWeight:'600',flex:1},
  routeLine:{width:24,height:1,backgroundColor:C.border,marginHorizontal:2},
  footer:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:14,paddingVertical:12,marginTop:6,borderTopWidth:1,borderTopColor:C.border},
  amtLabel:{fontSize:11,color:C.muted,marginBottom:1}, amt:{fontSize:17,fontWeight:'800',color:C.brand},
  footerRight:{flexDirection:'row',alignItems:'center',gap:10}, expandBtn:{padding:4},
  expanded:{paddingHorizontal:14,paddingBottom:14},
  expandDivider:{height:1,backgroundColor:C.border,marginBottom:10},
  eRow:{flexDirection:'row',alignItems:'center',gap:7,paddingVertical:5},
  eLabel:{fontSize:12,color:C.muted,width:76}, eVal:{fontSize:13,color:C.text,fontWeight:'500',flex:1},
  viewBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,marginTop:10,paddingVertical:9,borderRadius:8,backgroundColor:'#EFF6FF'},
  viewBtnText:{fontSize:13,fontWeight:'700',color:C.brand},
  empty:{alignItems:'center',justifyContent:'center',paddingVertical:72,gap:8},
  emptyTitle:{fontSize:16,fontWeight:'600',color:C.text}, emptySub:{fontSize:13,color:C.muted},
});
